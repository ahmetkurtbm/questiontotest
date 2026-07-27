import { currentUser, failure, unauthorized } from "@/lib/session";
import { questionCounts } from "@/lib/questions";

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) return unauthorized();

    return Response.json(await questionCounts(user.id));
  } catch (error) {
    return failure(error);
  }
}
