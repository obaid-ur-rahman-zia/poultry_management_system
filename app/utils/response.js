import { NextResponse } from "next/server";

export function successResponse(result, message, code = 200) {
  return NextResponse.json(
    {
      response_code: code,
      response_status: "success",
      response_message: message,
      response_result: result,
    },
    { status: code }
  );
}

export function errorResponse(err, code) {
  return NextResponse.json(
    {
      response_code: code,
      response_status: "error",
      response_message: err?.message,
      response_result: null,
    },
    { status: code }
  );
}
