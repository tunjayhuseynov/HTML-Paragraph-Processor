import HTMLParagraphProcessor from "../src"
import { HTMLString, ParagraphObject } from "./data"


// test("checking parseParagraphs", async () => {
//     const process = new HTMLParagraphProcessor()

//     jest.spyOn(Math, "random").mockReturnValue(0)
//     jest.spyOn(Date, "now").mockReturnValue(1)


//     const result = process.parseParagraphs("h2", HTMLString) //18c2ae8dd572
//     console.log(result)
//     expect(result).toBe(ParagraphObject)
// })

test("checking generateHTMLfromParagraphs", () => {
    const process = new HTMLParagraphProcessor()

    const result = process.generateHTMLfromParagraphs(ParagraphObject)
    expect(result).toBe(HTMLString)
})