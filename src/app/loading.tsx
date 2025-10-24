import { Spinner } from "@/components/ui/spinner";

export default function Loading() {
  return (
    <div className="h-screen w-screen grid place-items-center">
      <Spinner className="h-8 w-8" />
    </div>
  );
}
