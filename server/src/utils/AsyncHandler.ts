import { NextFunction, RequestHandler, Request, Response } from "express"


const AsyncHandler = (requestHandler: RequestHandler) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(requestHandler(req, res, next))
            .catch(err => console.log(err))
    }
}

export { AsyncHandler }