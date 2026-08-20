import { Toaster as Sonner, type ToasterProps } from "sonner"

function Toaster(props: ToasterProps) {
  return (
    <Sonner
      position="top-center"
      toastOptions={{
        classNames: {
          toast: "rounded-2xl! border! border-border! bg-card! text-foreground! shadow-lg! font-sans!",
          description: "text-muted-foreground!",
          actionButton: "bg-primary! text-primary-foreground!",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
