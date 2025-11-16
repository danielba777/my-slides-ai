import { auth } from "@/server/auth";
import "server-only";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError, UTApi } from "uploadthing/server";

const f = createUploadthing();

export const utapi = new UTApi();

export const ourFileRouter = {
  
  imageUploader: f({ image: { maxFileSize: "4MB" } })
    
    .middleware(async () => {
      
      const session = await auth();

      console.log(session);
      
      if (!session) throw new UploadThingError("Unauthorized");

      
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      
      console.log("Upload complete for userId:", metadata.userId);

      console.log("file url", file.url);

      
      return { uploadedBy: metadata.userId };
    }),
  editorUploader: f({
    image: { maxFileSize: "4MB" },
    pdf: { maxFileSize: "16MB" },
    text: { maxFileSize: "16MB" },
    video: { maxFileSize: "64MB" },
  })
    .middleware(async () => {
      const session = await auth();
      if (!session) throw new UploadThingError("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ file }) => {
      
      return {
        key: file.key,
        name: file.name,
        size: file.size,
        type: file.type,
        url: file.ufsUrl,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
