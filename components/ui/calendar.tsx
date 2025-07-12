"use client"

import React from "react"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"

interface CalendarProps {
  selected: Date | null
  onChange: (date: Date | null) => void
  disabled?: (date: Date) => boolean
}

const Calendar: React.FC<CalendarProps> = ({ selected, onChange, disabled }) => {
  return (
    <DatePicker
      selected={selected}
      onChange={onChange}
      filterDate={disabled}
      inline
    />
  )
}

export { Calendar }
