
export interface IHTMLParagraphResult {
    hookParagraph?: string | undefined,
    paragraphs: {
        [id: string]: {
            title: string
            content: string,
            paragraphs?: IHTMLParagraphResult['paragraphs'],
            key: string
        }
    },
    paragraphTitles: string[],
}

interface IHeader {
    next: keyof IHTMLParagraphProcessor["regex"] | undefined,
    pattern: RegExp,
    onlyTextPattern: RegExp
}

export interface IHTMLParagraphProcessor {
    regex: {
        h3: IHeader, h2: IHeader
    }
    parseParagraphs: (tagKey: keyof IHTMLParagraphProcessor["regex"], html: string) => IHTMLParagraphResult,
    generateHTMLfromParagraphs: (obj: IHTMLParagraphResult) => {
        content: string;
        keyTitleArray: IKeyTitleArrayItem[];
    }
}

export interface IKeyTitleArrayItem { key: string, title: string, children?: IKeyTitleArrayItem[] }

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
        const keyTitleArray: IKeyTitleArrayItem[] = []
        const content = obj.hookParagraph += this.combineContent(obj.paragraphs, keyTitleArray)
        return {
            content,
            keyTitleArray
        }
    }

    private combineContent(paragraphs: IHTMLParagraphResult["paragraphs"], keyTitleArrSource: IKeyTitleArrayItem[]): string {
        let combinedContent: string = "";

        function traverseParagraphs(currentParagraph: IHTMLParagraphResult["paragraphs"][number] | undefined, key: string, keyTitleArr: IKeyTitleArrayItem[] | undefined) {
            if (currentParagraph) {
                combinedContent += `<div class="${key}">${currentParagraph.content}</div>`
                const newArrItem = {
                    key,
                    title: currentParagraph.title,
                    children: !!currentParagraph.paragraphs ? [] as IKeyTitleArrayItem[] : undefined
                }
                keyTitleArr?.push(newArrItem)

                if (currentParagraph.paragraphs) {
                    for (const [key, childParagraph] of Object.entries(currentParagraph.paragraphs)) {
                        traverseParagraphs(childParagraph, key, newArrItem.children);
                    }
                }
            }
        }

        for (const [key, paragraph] of Object.entries(paragraphs)) {
            traverseParagraphs(paragraph, key, keyTitleArrSource);
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
                paragraphs: child?.paragraphs,
                key: ""
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