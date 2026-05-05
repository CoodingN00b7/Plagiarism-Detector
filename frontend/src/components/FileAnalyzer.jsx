import React from "react";
import Button from "./Button";
import Input from "./Input";

export default function FileAnalyzer({ files, onChange, onSubmit, loading, error }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input
        type="file"
        label="Documents"
        accept=".pdf,.txt,.doc,.docx"
        multiple
        onChange={onChange}
        helperText={files.length ? `${files.length} file(s) selected` : "Choose one or more documents"}
      />

      <Button loading={loading} disabled={!files.length} type="submit">
        {loading ? "Analyzing..." : "Analyze"}
      </Button>

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
    </form>
  );
}