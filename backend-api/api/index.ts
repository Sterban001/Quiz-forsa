
import app from '../src/index'

export default function handler(req: any, res: any) {
    // Use the express app as the request handler
    app(req, res)
}
