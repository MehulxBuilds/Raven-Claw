import { getDBUser } from "@/utils/auth-utils";
import { redirect } from "next/navigation";

const ThreadLayout = async({children}: { children: React.ReactNode }) => {
    const user = await getDBUser();
    if(user.preferredPostMedia.length === 0 || user.preferredPostTopics.length === 0) {
        redirect('/onboard');
    }
    return (
        <div>{children}</div>
    )
}

export default ThreadLayout;