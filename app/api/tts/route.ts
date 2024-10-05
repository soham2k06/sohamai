import { textToSpeech } from "@/lib/elevanlabs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { message } = await req.json();
  try {
    const audioStream = await textToSpeech({ text: message });

    return new Response(audioStream as unknown as BodyInit, {
      headers: { "Content-Type": "audio/mpeg" },
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode || 500 }
    );
  }
}
