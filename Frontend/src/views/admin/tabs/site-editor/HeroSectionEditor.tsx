import React from "react"
import { GenericSectionEditor } from "./GenericSectionEditor"
import { SECTION_FIELDS } from "../../../../data/admin"

interface HeroSectionEditorProps {
  data: Record<string, string>
  setData: React.Dispatch<React.SetStateAction<Record<string, string>>>
  handleImageFileChange: (
    key: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => void
  handlePdfFileChange: (
    key: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => void
}

export const HeroSectionEditor: React.FC<HeroSectionEditorProps> = ({
  data,
  setData,
  handleImageFileChange,
  handlePdfFileChange,
}) => {
  const fields = SECTION_FIELDS["hero"] || []
  return (
    <GenericSectionEditor
      fields={fields}
      data={data}
      setData={setData}
      handleImageFileChange={handleImageFileChange}
      handlePdfFileChange={handlePdfFileChange}
    />
  )
}

export default HeroSectionEditor
