import React from "react";
import Button from "./Button";
import Input from "./Input";

export default function TextAnalyzer({ value, onChange, onSubmit, loading, error }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input
        multiline
        rows={12}
        label="Text"
        value={value}
        onChange={onChange}
        placeholder="Paste your text here..."
      />

      <div className="flex flex-wrap items-center gap-3">
        <Button loading={loading} disabled={value.trim().length < 20} type="submit">
          {loading ? "Analyzing..." : "Analyze"}
        </Button>
      </div>

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
    </form>
  );
}