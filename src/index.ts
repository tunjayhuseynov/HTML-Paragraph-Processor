
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

export interface IGenerateHTMLfromParagraphs {
    content: string;
    keyTitleArray: IKeyTitleArrayItem[];
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

    generateHTMLfromParagraphs(obj: Pick<IHTMLParagraphResult, "paragraphs" | "hookParagraph">, disableDivWrapper?: boolean): IGenerateHTMLfromParagraphs {
        const keyTitleArray: IKeyTitleArrayItem[] = []
        const content = obj.hookParagraph += this.combineContent(obj.paragraphs, keyTitleArray, disableDivWrapper)
        return {
            content,
            keyTitleArray
        }
    }

    private combineContent(paragraphs: IHTMLParagraphResult["paragraphs"], keyTitleArrSource: IKeyTitleArrayItem[], disableDivWrapper?: boolean): string {
        let combinedContent: string = "";

        function traverseParagraphs(currentParagraph: IHTMLParagraphResult["paragraphs"][number] | undefined, key: string, keyTitleArr: IKeyTitleArrayItem[] | undefined) {
            if (currentParagraph) {
                combinedContent += (disableDivWrapper ? currentParagraph.content : `<div class="${key}">${currentParagraph.content}</div>`)
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
            paragraphs: paragraphArray.reduce((a: any, c, index) => {
                a[this.generateSmallId() + index] = c;
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

let a = `<p>Apple&#39;s products are known for their simplicity and ease of use. Most of us already know that Apple acted with this thought when designing the iPhone. But despite that, there are a few simple ways to make the iPhone more usable than it already is. Here are a few of them given by <a href="https://www.simplyfixable.com/" target="_blank">Simply Fixable</a>.</p>

<p><meta charset="utf-8" /></p>

<h2 dir="ltr"><strong>1. One-Handed Keyboard Control</strong></h2>

<p dir="ltr">One-handed keyboard control has become a much-loved feature and is growing in popularity. Previously, typing with one hand was a bit difficult on Plus models of the iPhone. However, Apple fixed this situation with iOS 11.</p>

<p dir="ltr">Thanks to this feature, you can use the keyboard either on the right or on the left. All you have to do is touch and hold the keyboard icon. Then you can choose the side you want and adjust the direction of the keyboard.</p>

<p dir="ltr">You can also permanently set your keyboard in the direction you want by following the Settings &gt;&gt; General &gt;&gt; Keyboards &gt;&gt; One Handed Keyboard sequence.</p>

<h2 dir="ltr"><strong>2.&nbsp;Easier Text Reading</strong></h2>

<p dir="ltr">Reading text on an <a href="https://www.simplyfixable.com/device/iphone-repair" target="_blank">iPhone</a> with a small screen can be a bit tiring. Fortunately, there is a way to make text larger and easier to read on the iPhone.</p>

<p dir="ltr">You can go to Settings &gt;&gt; General &gt;&gt; Accessibility &gt;&gt; Large Text, set the size you want and make the texts easier to read. You can also make the text bolder by choosing the bold font from the accessibility menu.</p>

<h2 dir="ltr"><strong>3.&nbsp;Creating Custom Vibration</strong></h2>

<p dir="ltr">If you are like most <a href="https://www.apple.com/iphone/" target="_blank">iPhone</a> users, you will receive several different notifications during the day such as email, text, call. The way to get rid of notification sounds is to mute the phone. However, you can create vibrations so that you can tell which notification is coming even when your phone is on silent. In this way, you will not miss a notification that is important to you.</p>

<p dir="ltr">Tap Settings &gt;&gt; Sounds(choose notification type) &gt;&gt; Create New Vibration by following the vibration order. Then follow the instructions you need to do.</p>

<p dir="ltr">Here you can assign the desired vibration for the notification you want. That&rsquo;s all!</p>

<p dir="ltr"><img alt="phone vibration" src="https://cdn.simplyfixable.com/uploads/media/big/media_20221016104015.jpg	" style="width: 100%; height: 100%;" /></p>

<p dir="ltr"><a href="https://www.guidingtech.com/how-to-create-and-use-custom-vibration-patterns-on-iphone/" target="_blank">Source</a></p>

<h2 dir="ltr"><strong>4.&nbsp;Faster Photo Sending</strong></h2>

<p dir="ltr">Thanks to Airdrop, you can transfer files (town, video, photo, etc.) between your Apple devices faster.</p>

<p dir="ltr">To send photos, videos or documents with Airdrop, just go to the &quot;Share&quot; section. If <a href="https://support.apple.com/en-us/HT204144" target="_blank">AirDrop</a> is set up correctly, a list of nearby devices to which you can send documents will appear on your phone&#39;s screen. Select the device to send from here and start the sending process. It&#39;s that easy.</p>

<h2 dir="ltr"><strong>5.&nbsp;Undo the Last Transaction</strong></h2>

<p dir="ltr">There is a fun way to undo what you did on your iPhone. All you have to do is shake the iPhone. After shaking your phone, a text appears on the screen to undo the operation. From here you can undo your last action in a fun way by tapping &ldquo;Undo&rdquo;.</p>

<h2 dir="ltr"><strong>6. Use Three Fingers to Correct a Mistake</strong></h2>

<p dir="ltr">You have two options if you make a typing error in a document or email:</p>

<p dir="ltr">At the top of the display, a tiny Undo option can be activated by sliding three fingers to the left.</p>

<p dir="ltr">Three finger taps on the screen will bring up a menu with Undo at the top of the screen.</p>

<h2 dir="ltr"><strong>7.&nbsp;Using Siri with Hands-Free</strong></h2>

<p dir="ltr">By activating the &quot;Hey Siri&quot; feature on your iPhone, you can communicate with Siri without touching your phone. This feature is available for <a href="https://support.apple.com/kb/SP726?locale=en_US" target="_blank">iPhone 6s</a> and higher models.</p>

<p dir="ltr">You can control Siri without touching your phone and use it easily by giving voice commands to it.</p>

<p dir="ltr">You can activate the feature by following:Settings &gt;&gt; General &gt;&gt; Siri &gt;&gt; Hey Siri.</p>

<p dir="ltr"><img alt="iphone siri" src="https://cdn.simplyfixable.com/uploads/media/big/media_20221016104021.jpg	" style="width: 100%; height: 100%;" /></p>

<p dir="ltr"><a href="https://www.businessinsider.com/guides/tech/how-to-use-siri-on-iphone-xr-xs-x" target="_blank">Source</a></p>

<h2 dir="ltr"><strong>8.&nbsp;Use the Home Bar to Quickly Switch between Apps</strong></h2>

<p dir="ltr">When using an app, you may have noticed a gray bar at the bottom of your screen if you have an iPhone without a Home button and Face ID. Without having to open the App Switcher, you may instantly return to your Home Screen or switch between your open apps with this bar.</p>

<p dir="ltr">Swipe left from the bottom of your <a href="https://www.simplyfixable.com/device/iphone-repair/screen-replacement" target="_blank">iPhones screen</a> to switch between open apps. If you continue moving to the left, you will see all of your open apps. This will take you to the most recent open app. You can swipe to the right until you discover the first app you used if you wish to return to it.</p>

<h2 dir="ltr"><strong>9.&nbsp;Go to the Top of the Page</strong></h2>

<p dir="ltr">With your iPhone, you can quickly return to the top if you&#39;ve been scrolling endlessly and realize you need to.</p>

<p dir="ltr">You&#39;ll need to tap close to the top edge of your screen to return there right away. However, you must manually scroll down to go back to where you were, so use caution.</p>

<h2 dir="ltr"><strong>10.&nbsp;There&rsquo;s no Need to Scroll any Longer</strong></h2>

<p dir="ltr">Want to use one hand to surf through papers, webpages, or anything else? Utilize the Back Tap function, which was introduced in iOS 14. It enables you to program commands that your iPhone can execute with a double- or triple-tap on the back.</p>

<ul>
	<li aria-level="1" dir="ltr">
	<p dir="ltr" role="presentation">Open Settings &gt;&gt; Accessibility &gt;&gt; Touch.</p>
	</li>
	<li aria-level="1" dir="ltr">
	<p dir="ltr" role="presentation">Scroll down the page to Back Tap and tap that</p>
	</li>
</ul>

<p dir="ltr">You may now select an action that will be carried out when you double- and triple-tap the rear of your iPhone. There are other options available, but better use double-tap the page to scroll down than triple-tap it to scroll back up.</p>

<h2 dir="ltr"><strong>11.&nbsp;Use Two Fingers to Swipe through a Busy In-Box</strong></h2>

<p dir="ltr">If you need to manually delete many emails, you can tap the Edit button, however, the following is simpler:</p>

<p dir="ltr">Put two fingers on the first email you want to delete, and lightly push and hold.</p>

<p dir="ltr">Keep your two fingers in place and swipe them down the in-box. Emails will slide slightly to the right and edit boxes will show up. You&rsquo;ll observe that touching an email will automatically select it, allowing you to delete it.</p>

<h2 dir="ltr"><strong>12. Quickly Share Screenshots</strong></h2>

<p dir="ltr">You&rsquo;ve found a webpage or part of a document that you need to send to a friend. The simplest way to accomplish this is to take a screenshot, hold your finger down on the preview area of your display while doing so, and then release it. The Share menu should then be displayed immediately after that.</p>

<p dir="ltr">As you are already in the sharing area, there is no need to first access the whole annotation screen before selecting Share.</p>

<h2 dir="ltr"><strong>13.&nbsp;Grab a Nice New Ringtone</strong></h2>

<p dir="ltr">Everyone usually uses the standard iPhone ringtone even though they have the option of changing it to almost any other ringtone they could ever want. Many people use the ringtone out of habit or because they think it would be difficult to change it.</p>

<p dir="ltr">To change your ringtone, all you need to do is go to Settings and select Sounds. After that, select Ringtone. Choose the option that most closely fits your personality.</p>

<h2 dir="ltr"><strong>14.&nbsp;Reduce the Strain on Your Eyes during Screen Time</strong></h2>

<p dir="ltr">Backlit screens are unappealing to optometrists, and the effects of &ldquo;blue light&rdquo; have generated a lot of debate in the field of eye care. If you frequently find yourself glancing at that bright rectangle in the dark, you may want to reconsider how you use your phone or, at the very least, change the screen to be easier on your eyes.</p>

<p dir="ltr">Instead, you can use a feature resembling Dark Mode, which ought to make your phone much gentler on the eyes. Open Settings &gt;&gt; General &gt;&gt; Accessibility. Once there, choose Invert Colors under Display Accommodations.</p>

<p dir="ltr">You have two choices from here: Smart Invert or Classic Invert. Except for photos, video, and a few apps that employ dark color schemes, Smart Invert Colors flips the display&rsquo;s colors. The display&rsquo;s colors are turned around via Classic Invert Colors.</p>

<h2 dir="ltr"><strong>15.&nbsp;Change Siri&rsquo;s Accent</strong></h2>

<p dir="ltr">Here&rsquo;s a creative method to switch up how you use your Apple devices. The primary voice of the Siri assistant, an American woman, is one that we are all accustomed to. You may have to be aware that you may change the gender, but you can also select from a variety of accents. American, Australian, British, Irish, and South African are the available possibilities.</p>

<ul>
	<li aria-level="1" dir="ltr">
	<p dir="ltr" role="presentation">To hear all the sounds and select a new accent, go to Settings &gt;&gt; Siri &amp; Search &gt;&gt; Siri Voice.</p>
	</li>
</ul>

<h2 dir="ltr"><strong>16.&nbsp;Make the Night Bright</strong></h2>

<p dir="ltr">You can choose a flashing light that will go off in place of all sounds and badges.</p>

<p dir="ltr">Open the Hearing tab under Setting &gt;&gt; General &gt;&gt; Accessibility. The LED Flash for Alerts slider should then be set to one or green. The next time you receive a notification, you&rsquo;ll be greeted by a flashing light.</p>

<h2 dir="ltr"><strong>17.&nbsp;Set Pictures for Incoming Calls&nbsp;</strong></h2>

<p dir="ltr">When someone calls your phone, you have the option of changing their name as well as their appearance. You can choose to display a full-screen image of the caller. You&#39;ll see your friend&#39;s photo when she calls.</p>

<p dir="ltr">Select the person you want to give a photo to by tapping the Phone icon &gt;&gt; Contacts &gt;&gt; Select Edit &gt;&gt; Photo. The photo will now greet you the following time they call.</p>

<h2 dir="ltr"><strong>18.&nbsp;Siri Can Help You Locate Lost AirPods</strong></h2>

<p dir="ltr">Siri will offer to blast a loud tone from your wireless earphones to assist you find them if you activate Siri and say, &ldquo;Find My AirPods.&rdquo;</p>

<h2 dir="ltr"><strong>19.&nbsp;You May Stop Apps from Continually Requesting Feedback&nbsp;</strong></h2>

<p dir="ltr">Find the &ldquo;In-App Ratings and Reviews&rdquo; setting by opening the Settings app, selecting iTunes and the App Store, and then clicking. Switch that off.</p>

<h2 dir="ltr"><strong>20. By Turning on this Particular Feature, You Can Take Photos that Seem Better</strong></h2>

<p dir="ltr">Open the Settings application, select Camera, then turn on the Grid. A grid of crosshairs will result from this.</p>

<p dir="ltr">According to the &ldquo;rule of thirds&rdquo; in photography, the subject or any other significant elements should be located around the intersection of these lines.</p>

<p dir="ltr">You can turn your iPhone into a professional camera if you adhere to this guideline, manage your exposure, and learn how to edit photos after they are shot.</p>

<h2 dir="ltr"><strong>21.&nbsp;Rather than Endlessly Scrolling, You Can Use Terms to Search Your Photos</strong></h2>

<p dir="ltr">Open the Photos app, select the Search option in the lower right corner, then enter any phrases that would describe the image you&#39;re looking for, such as &quot;movie,&quot; to find it. Additionally, you can combine words in your search, such as &quot;movie&quot; and &quot;drinks.&quot;</p>

<h2 dir="ltr"><strong>22.&nbsp;You Can Train Siri to Give You a Nickname</strong></h2>

<p dir="ltr">Hold the side button on your iPhone to activate Siri, then tell it to &quot;Call me (nickname) from now on.&quot;</p>

<h2 dir="ltr"><strong>23.&nbsp;You Don&rsquo;t Even Need to Open Your iPhone to Use it as a Flashlight</strong></h2>

<p dir="ltr">The lock screen&rsquo;s bottom-left button displays a picture of a flashlight when you wake your iPhone. Your phone will turn on its rear flash as a light when you press into it.</p>

<p dir="ltr">Compared to unlocking the phone and selecting the flashlight option from the Control Center, this method is significantly faster.</p>

<p dir="ltr"><img alt="phone flashlight" src="https://cdn.simplyfixable.com/uploads/media/big/media_20221016104030.jpg	" style="width: 100%; height: 100%;" /></p>

<p dir="ltr"><a href="https://www.businessinsider.com/guides/tech/how-to-turn-on-flashlight-on-iphone" target="_blank">Source</a></p>

<h2 dir="ltr"><strong>24.&nbsp;One iPhone Function Can Prevent a Fatal Car Accident</strong></h2>

<p dir="ltr">You can turn on Do Not Disturb While Driving in your Control Center. If you have this function enabled, your phone will immediately switch to Do Not Disturb if it detects that you are in a car that is traveling faster than the posted speed limit.</p>

<p dir="ltr">You can choose to send a pre-written reply to let people know you&rsquo;re out of the office and will get back to them shortly after notifications, texts, and phone calls are muted immediately.</p>

<h2 dir="ltr"><strong>25.&nbsp;In Apple Music, You May Search for a Song using its Lyrics</strong></h2>

<p dir="ltr">Enter the song&rsquo;s lyrics into Apple Music&rsquo;s Search tab if you&rsquo;re looking for a song but don&rsquo;t know its name but know how it goes. Shazam should be able to locate the majority of songs based on a few phrases, since Apple owns Shazam.</p>

<h2 dir="ltr"><strong>26.&nbsp;You Can Modify Notifications without Even Unlocking your phone&nbsp;</strong></h2>

<p dir="ltr">If you receive a notification, click Manage by pressing it or swiping from the right on your lock screen. From this point, you can request that all future notifications be silenced or turned off.</p>
`

new HTMLParagraphProcessor().parseParagraphs("h2", a)