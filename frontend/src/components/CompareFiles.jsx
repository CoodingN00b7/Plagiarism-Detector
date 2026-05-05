import React from "react";
import Button from "./Button";
import Input from "./Input";

export default function CompareFiles({ leftFile, rightFile, onLeftChange, onRightChange, onSubmit, loading, error }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Input
          type="file"
          label="Document A"
          accept=".pdf,.txt,.doc,.docx"
          onChange={onLeftChange}
          helperText={leftFile?.name || "Choose the first document"}
        />
        <Input
          type="file"
          label="Document B"
          accept=".pdf,.txt,.doc,.docx"
          onChange={onRightChange}
          helperText={rightFile?.name || "Choose the second document"}
        />
      </div>

      <Button loading={loading} disabled={!leftFile || !rightFile} type="submit">
        {loading ? "Comparing..." : "Compare"}
      </Button>

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
    </form>
  );
}