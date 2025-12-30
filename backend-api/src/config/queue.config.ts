import { Queue } from 'bullmq'

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

// Grading queue for processing test submissions
export const gradingQueue = new Queue('grading', {
    connection: {
        url: REDIS_URL,
    },
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000,
        },
        removeOnComplete: {
            age: 24 * 3600, // Keep completed jobs for 24 hours
            count: 1000,
        },
        removeOnFail: {
            age: 7 * 24 * 3600, // Keep failed jobs for 7 days
        },
    },
})

// Job data interface
export interface GradingJobData {
    attemptId: string
    userId: string
    testId: string
}

// Add job to queue
export async function addGradingJob(data: GradingJobData) {
    return await gradingQueue.add('grade-attempt', data, {
        jobId: `grade-${data.attemptId}`, // Prevent duplicate jobs
    })
}

// Get job status
export async function getJobStatus(attemptId: string) {
    const job = await gradingQueue.getJob(`grade-${attemptId}`)
    if (!job) return null

    return {
        id: job.id,
        state: await job.getState(),
        progress: job.progress,
        returnvalue: job.returnvalue,
        failedReason: job.failedReason,
    }
}

console.log('✅ Grading queue configured')
