import React, { Dispatch } from "react";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";

function CheckboxWithLabel({ text, checked, setChecked }: { text: string, checked: boolean, setChecked: Dispatch<React.SetStateAction<boolean>> }) {
  return (
    <div className="flex gap-2 items-center my-2">
      <Checkbox id={text.split(" ")[0] || text} checked={checked} onCheckedChange={(value: boolean) => setChecked(value)}/>
      <Label htmlFor={text.split(" ")[0] || text}>{text}</Label>
    </div>
  );
}

export default CheckboxWithLabel;
