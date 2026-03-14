import { Hint } from "@repo/ui";
import CreatePostModal from "./create-post-modal";

const CreatePostsButton = () => {
    return (
        <Hint label="Generate Post" side="top" align="center" asChild>
            <div>
                <CreatePostModal />
            </div>
        </Hint>
    )
}

export default CreatePostsButton;
