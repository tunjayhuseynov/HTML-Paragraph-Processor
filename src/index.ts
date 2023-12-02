interface IHTMLParagraphResult {
    hookParagraph: string | undefined,
    paragraphs: {
        [id: string]: {
            title: string
            content: string,
            paragraphs?: IHTMLParagraphResult['paragraphs']
        }
    },
    paragraphTitles: string[],
}

interface IHeader {
    next: keyof IHTMLParagraphProcessor["regex"] | undefined,
    pattern: RegExp,
    onlyTextPattern: RegExp
}

interface IHTMLParagraphProcessor {
    regex: {
        h3: IHeader, h2: IHeader
    }
    parseParagraphs: (tagKey: keyof IHTMLParagraphProcessor["regex"], html: string) => IHTMLParagraphResult
}

export default class HTMLParagraphProcessor implements IHTMLParagraphProcessor {
    regex = {
        h3: {
            next: undefined,
            pattern: /<h3\b[^>]*>.*?<\/h3>/g,
            onlyTextPattern: /<h3\b[^>]*>(.*?)<\/h3>/g,
        },
        h2: {
            next: "h3",
            pattern: /<h2\b[^>]*>.*?<\/h2>/g,
            onlyTextPattern: /<h2\b[^>]*>(.*?)<\/h2>/g
        }
    } as const

    generateHTMLfromParagraphs(obj: IHTMLParagraphResult) {
        return obj.hookParagraph += this.combineContent(obj.paragraphs)
    }

    private combineContent(paragraphs: IHTMLParagraphResult["paragraphs"]): string {
        let combinedContent: string = "";

        function traverseParagraphs(currentParagraph: IHTMLParagraphResult["paragraphs"][number] | undefined) {
            if (currentParagraph) {
                combinedContent += currentParagraph.content

                if (currentParagraph.paragraphs) {
                    for (const childParagraph of Object.values(currentParagraph.paragraphs)) {
                        traverseParagraphs(childParagraph);
                    }
                }
            }
        }

        for (const paragraph of Object.values(paragraphs)) {
            traverseParagraphs(paragraph);
        }

        return combinedContent;
    }


    parseParagraphs(tagKey: keyof typeof this.regex, html: string): IHTMLParagraphResult {
        let hook: string | undefined;

        const paragraphs = html.split(this.regex[tagKey].pattern).filter(s => s)
        const headingArray = html.match(this.regex[tagKey].pattern) || []
        const headingArrayContent = [...html.matchAll(this.regex[tagKey].onlyTextPattern)].map(s => s[1]) || []


        if (paragraphs.length > headingArray.length) {
            hook = paragraphs.shift()
        }

        for (let index = 0; index < paragraphs.length; index++) {
            paragraphs[index] = headingArray[index] + paragraphs[index]
        }

        const paragraphArray = paragraphs.map((content) => {
            const child = this.regex[tagKey].next && this.hasHeading(this.regex[tagKey].next, content) ? this.parseParagraphs(this.regex[tagKey].next as any, content) : undefined
            if (child) {
                Object.values(child?.paragraphs ?? {}).forEach((childContent) => {
                    if (childContent.content) {
                        content = content.replace(childContent.content, "")
                    }
                })
            }

            return {
                title: [...content.matchAll(this.regex[tagKey].onlyTextPattern)].map(s => s[1]).join(",") ?? "",
                content,
                paragraphs: child?.paragraphs
            }
        }) as IHTMLParagraphResult["paragraphs"][string][]

        return {
            hookParagraph: hook,
            paragraphs: paragraphArray.reduce((a: any, c) => {
                a[this.generateSmallId()] = c;
                return a;
            }, {}),
            paragraphTitles: headingArrayContent,
        }
    }

    private generateSmallId(): string {
        const timestamp = new Date().getTime().toString(16);
        const random = Math.floor(Math.random() * 1000).toString(16);
        const id = timestamp + random;
        return id;
    }


    private hasHeading(tagKey: string | undefined, html: string) {
        if (!tagKey || !this.regex[tagKey as keyof typeof this.regex]) return false;
        return (html.match(this.regex[tagKey as keyof typeof this.regex].pattern) || []).length > 0
    }
}