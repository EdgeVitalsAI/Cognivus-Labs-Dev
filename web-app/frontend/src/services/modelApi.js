import api from "./api";

// Run inference
export const runInference = (data) =>
  api.post("/admin/model-inference", data);
