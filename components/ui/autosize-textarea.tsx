import { cn } from "@/lib/utils";
import { TextareaHTMLAttributes, useEffect, useRef } from "react";

type AutosizeTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

function AutosizeTextarea({
  value,
  onChange,
  className,
  ...props
}: AutosizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const newHeight = Math.max(textareaRef.current.scrollHeight, 48);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  };

  useEffect(() => resize(), [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange?.(e);
    resize();
  };

  return (
    <textarea
      {...props}
      ref={textareaRef}
      value={value}
      className={cn(
        "flex w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none resize-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      onChange={handleChange}
    />
  );
}

export default AutosizeTextarea;
