import React from "react";
import Button from "./Button";
import Input from "./Input";

export default function CompareText({ leftValue, rightValue, onLeftChange, onRightChange, onSubmit, loading, error }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Input multiline rows={10} label="Text A" value={leftValue} onChange={onLeftChange} placeholder="First text" />
        <Input multiline rows={10} label="Text B" value={rightValue} onChange={onRightChange} placeholder="Second text" />
      </div>

      <Button loading={loading} disabled={leftValue.trim().length < 20 || rightValue.trim().length < 20} type="submit">
        {loading ? "Comparing..." : "Compare"}
      </Button>

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
    </form>
  );
}