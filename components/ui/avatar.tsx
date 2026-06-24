import { cn, initials } from "@/lib/utils";

interface AvatarProps {
  firstName?: string;
  lastName?: string;
  src?: string | null;
  className?: string;
}

export function Avatar({ firstName, lastName, src, className }: AvatarProps) {
  return (
    <div
      className={cn(
        "relative flex size-11 items-center justify-center overflow-hidden rounded-full bg-primary-soft text-sm font-bold text-primary",
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={`${firstName ?? ""} ${lastName ?? ""}`.trim()} className="size-full object-cover" />
      ) : (
        <span>{initials(firstName, lastName)}</span>
      )}
    </div>
  );
}
