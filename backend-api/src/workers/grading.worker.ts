import { Worker } from 'bullmq'
import { supabaseAdmin } from '../config/supabase'
import type { GradingJobData } from '../config/queue.config'

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

// Worker to process grading jobs
const gradingWorker = new Worker(
    'grading',
    async (job) => {
        const { attemptId } = job.data as GradingJobData

        console.log(`🎯 Processing grading job for attempt: ${attemptId}`)

        try {
            // Update progress
            await job.updateProgress(10)

            // Call the database grading function
            const { error } = await supabaseAdmin.rpc('calculate_attempt_score', {
                p_attempt_id: attemptId,
            })

            if (error) {
                console.error('Grading function error:', error)
                throw new Error(`Grading failed: ${error.message}`)
            }

            await job.updateProgress(90)

            // Fetch the graded attempt
            const { data: attempt, error: fetchError } = await supabaseAdmin
                .from('attempts')
                .select('score, max_score, status')
                .eq('id', attemptId)
                .single()

            if (fetchError) {
                throw new Error(`Failed to fetch graded attempt: ${fetchError.message}`)
            }

            await job.updateProgress(100)

            console.log(`✅ Grading completed for attempt: ${attemptId}`)
            console.log(`   Score: ${attempt.score}/${attempt.max_score}`)

            return {
                attemptId,
                score: attempt.score,
                maxScore: attempt.max_score,
                status: attempt.status,
            }
        } catch (error: any) {
            console.error(`❌ Grading failed for attempt ${attemptId}:`, error)
            throw error
        }
    },
    {
        connection: {
            url: REDIS_URL,
        },
        concurrency: 10, // Process up to 10 jobs concurrently
        limiter: {
            max: 50, // Max 50 jobs per duration
            duration: 1000, // Per second
        },
    }
)

// Event listeners
gradingWorker.on('completed', (job) => {
    console.log(`✅ Job ${job.id} completed`)
})

gradingWorker.on('failed', (job, err) => {
    console.error(`❌ Job ${job?.id} failed:`, err.message)
})

gradingWorker.on('error', (err) => {
    console.error('Worker error:', err)
})

console.log('🚀 Grading worker started')

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, closing worker...')
    await gradingWorker.close()
    process.exit(0)
})

process.on('SIGINT', async () => {
    console.log('SIGINT received, closing worker...')
    await gradingWorker.close()
    process.exit(0)
})
