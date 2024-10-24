"use client"

import * as React from "react"
import { CalendarIcon } from "@radix-ui/react-icons"
import { format } from "date-fns"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

// Don't change this component, as per your request
export function DatePicker({ date, onChange }) {   // Accept date and onChange from Formik
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-[250px] bg-[var(--dark)] justify-start gap-3 rounded border-zinc-400 hover:bg-[var(--grey)] text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon />
          {date ? format(date, "PPP") : <span className="pt-[1px]">Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto border-zinc-400 rounded p-0" align="start">
        <Calendar
          mode="single"
          selected={date}        // Pass the date from Formik here
          onSelect={onChange}    // Trigger Formik's setFieldValue here
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}