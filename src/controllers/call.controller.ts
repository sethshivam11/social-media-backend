import { Request, Response } from "express";
import { asyncHandler } from "../utils/AsyncHandler";
import { ApiError } from "../utils/ApiError";
import { Call } from "../models/call.model";
import { ApiResponse } from "../utils/ApiResponse";
import { emitSocketEvent } from "../socket";
import { ChatEventEnum } from "../constants";

const getCalls = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { _id } = req.user;

  const calls = await Call.find({ users: _id }).populate({
    model: "user",
    path: "caller callee",
    select: "avatar username fullName",
    strictPopulate: false,
  });

  if (!calls || !calls.length) {
    throw new ApiError(404, "No calls found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, calls, "Calls fetched successfully"));
});

const getCall = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { callId } = req.params;

  const call = await Call.findById(callId).populate({
    model: "user",
    path: "caller callee",
    select: "avatar username fullName",
    strictPopulate: false,
  });

  if (!call) {
    throw new ApiError(404, "Call not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, call, "Call fetched successfully"));
});

const startCall = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { _id } = req.user;
  const { callee, type } = req.body;

  if (!callee || !type) {
    throw new ApiError(400, "Invalid request body");
  }

  if (callee === _id.toString()) {
    throw new ApiError(400, "Cannot call yourself");
  }

  const call = await Call.create({
    caller: _id,
    callee,
    type,
    status: "ongoing",
  });

  await call.populate({
    model: "user",
    path: "caller callee",
    select: "avatar username fullName",
    strictPopulate: false,
  });

  emitSocketEvent(callee, ChatEventEnum.NEW_CALL_EVENT, call);

  return res
    .status(201)
    .json(new ApiResponse(201, call, "Call started successfully"));
});

const updateCall = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { _id } = req.user;
  const { callId } = req.params;
  const { acceptedAt, endedAt } = req.body;

  const call = await Call.findById(callId);
  if (!call) {
    throw new ApiError(404, "Call not found");
  }

  if (
    _id.toString() !== call.caller.toString() &&
    _id.toString() !== call.callee.toString()
  ) {
    throw new ApiError(403, "Unauthorized to accept call");
  }

  if (acceptedAt) call.acceptedAt = acceptedAt;
  if (endedAt) call.endedAt = endedAt;
  await call.save();

  return res
    .status(200)
    .json(new ApiResponse(200, call, "Call accepted successfully"));
});

const endCall = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not verified");
  }
  const { _id } = req.user;
  const { callId } = req.params;

  const call = await Call.findById(callId);

  if (!call) {
    throw new ApiError(404, "Call not found");
  }
  if (
    _id.toString() !== call.caller.toString() &&
    _id.toString() !== call.callee.toString()
  ) {
    throw new ApiError(403, "Unauthorized to end call");
  }

  call.endedAt = new Date();
  await call.save();

  const { caller, callee } = call;
  emitSocketEvent(
    caller.toString() === _id.toString()
      ? caller.toString()
      : callee.toString(),
    ChatEventEnum.CALL_DISCONNECTED_EVENT,
    call
  );

  return res
    .status(200)
    .json(new ApiResponse(200, call, "Call ended successfully"));
});

export { getCalls, getCall, startCall, updateCall, endCall };
