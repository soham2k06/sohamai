import { cn } from "@/lib/utils";
import { DetailedHTMLProps, InputHTMLAttributes, useRef } from "react";

type AutosizeTextareaProps = DetailedHTMLProps<
  InputHTMLAttributes<HTMLTextAreaElement>,
  HTMLTextAreaElement
>;

function AutosizeTextarea({
  onChange,
  className,
  ...props
}: AutosizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange?.(e);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const newHeight = Math.max(textareaRef.current.scrollHeight, 48);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  };

  return (
    <textarea
      {...props}
      ref={textareaRef}
      className={cn(
        "flex w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none resize-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      onChange={handleChange}
    />
  );
}

export default AutosizeTextarea;
