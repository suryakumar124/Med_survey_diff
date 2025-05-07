import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-primary"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M16 2C8.268 2 2 8.268 2 16C2 23.732 8.268 30 16 30C23.732 30 30 23.732 30 16C30 8.268 23.732 2 16 2ZM11 10C9.895 10 9 10.895 9 12C9 13.105 9.895 14 11 14C12.105 14 13 13.105 13 12C13 10.895 12.105 10 11 10ZM15 22C15 20.8954 14.1046 20 13 20H9C7.89543 20 7 20.8954 7 22C7 23.1046 7.89543 24 9 24H13C14.1046 24 15 23.1046 15 22ZM21 10C19.895 10 19 10.895 19 12C19 13.105 19.895 14 21 14C22.105 14 23 13.105 23 12C23 10.895 22.105 10 21 10ZM23 20H19C17.8954 20 17 20.8954 17 22C17 23.1046 17.8954 24 19 24H23C24.1046 24 25 23.1046 25 22C25 20.8954 24.1046 20 23 20Z"
          fill="currentColor"
        />
      </svg>
      <span className="text-xl font-semibold">MedSurvey</span>
    </div>
  );
}
