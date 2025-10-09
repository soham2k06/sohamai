export type CoreMessage = {
  id?: string;
  role: "user" | "model";
  content: string;
};
