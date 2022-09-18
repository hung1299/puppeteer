const { convert } = require("html-to-text");
const {
    LINK_TYPE,
    IMAGE_TYPE,
    PARAGRAPH_TYPE,
    H2_TYPE,
    H3_TYPE,
    H4_TYPE,
    H5_TYPE,
    H6_TYPE,
} = require("../utils/constant");

const parseHtml = (htmlContent) => {
    const text = convert(htmlContent, {
        wordwrap: false,
        preserveNewlines: true,
        formatters: {
            aBlockFormatter: function (elem, walk, builder, formatOptions) {
                builder.addInline("{");
                builder.addInline('"type":');
                builder.addInline(`"${LINK_TYPE}"`);
                builder.addInline(",");
                builder.addInline('"text":"');
                walk(elem.children, builder);
                builder.addInline('"');
                builder.addInline(",");
                builder.addInline('"url":');
                builder.addInline(`"${elem.attribs.href}"`);
                builder.addInline("}");
            },
            imgBlockFormatter: function (elem, walk, builder, formatOptions) {
                builder.addInline("{");
                builder.addInline('"type":');
                builder.addInline(`"${IMAGE_TYPE}"`);
                builder.addInline(",");
                builder.addInline('"url":');
                builder.addInline(`"${elem.attribs.src}"`);
                builder.addInline(",");
                builder.addInline('"alt":');
                builder.addInline(`"${elem.attribs.alt}"`);
                builder.addInline(",");
                builder.addInline('"width":');
                builder.addInline(`"${elem.attribs.width}"`);
                builder.addInline(",");
                builder.addInline('"height":');
                builder.addInline(`"${elem.attribs.height}"`);
                builder.addInline("}");
            },
            h2BlockFormatter: function (elem, walk, builder, formatOptions) {
                builder.addInline("{");
                builder.addInline('"type":');
                builder.addInline(`"${H2_TYPE}"`);
                builder.addInline(",");
                builder.addInline('"text":"');
                walk(elem.children, builder);
                builder.addInline('"');
                builder.addInline("}");
            },
            h3BlockFormatter: function (elem, walk, builder, formatOptions) {
                builder.addInline("{");
                builder.addInline('"type":');
                builder.addInline(`"${H3_TYPE}"`);
                builder.addInline(",");
                builder.addInline('"text":"');
                walk(elem.children, builder);
                builder.addInline('"');
                builder.addInline("}");
            },
            h4BlockFormatter: function (elem, walk, builder, formatOptions) {
                builder.addInline("{");
                builder.addInline('"type":');
                builder.addInline(`"${H4_TYPE}"`);
                builder.addInline(",");
                builder.addInline('"text":"');
                walk(elem.children, builder);
                builder.addInline('"');
                builder.addInline("}");
            },
            h5BlockFormatter: function (elem, walk, builder, formatOptions) {
                builder.addInline("{");
                builder.addInline('"type":');
                builder.addInline(`"${H5_TYPE}"`);
                builder.addInline(",");
                builder.addInline('"text":"');
                walk(elem.children, builder);
                builder.addInline('"');
                builder.addInline("}");
            },
            h6BlockFormatter: function (elem, walk, builder, formatOptions) {
                builder.addInline("{");
                builder.addInline('"type":');
                builder.addInline(`"${H6_TYPE}"`);
                builder.addInline(",");
                builder.addInline('"text":"');
                walk(elem.children, builder);
                builder.addInline('"');
                builder.addInline("}");
            },
        },
        selectors: [
            {
                selector: "a",
                format: "aBlockFormatter",
            },
            {
                selector: "img",
                format: "imgBlockFormatter",
            },
            {
                selector: "h2",
                format: "h2BlockFormatter",
            },
            {
                selector: "h3",
                format: "h3BlockFormatter",
            },
            {
                selector: "h4",
                format: "h4BlockFormatter",
            },
            {
                selector: "h5",
                format: "h5BlockFormatter",
            },
            {
                selector: "h6",
                format: "h6BlockFormatter",
            },
        ],
    }); 
    return text.split("\n").filter(t => t.length !== 0);
};

const formatHtmlString = (htmlContent) => {
    const HtmlString = parseHtml(htmlContent);
    const result = HtmlString.map((str) => {
        const arr = [];
        let text = "";
        let indexEnd = -1;
        for (let index = 0; index < str.length; index++) {
            if (index <= indexEnd) {
                continue;
            }
            if (str[index] === "{" || index === str.length - 1) {
                if (text !== "") {
                    text += str[index];
                    arr.push({
                        type: PARAGRAPH_TYPE,
                        text,
                    });
                    text = "";
                }

                indexEnd = str.indexOf("}", index);
                if (indexEnd !== -1) {
                    arr.push(JSON.parse(str.slice(index, indexEnd + 1)));
                    continue;
                }
            }
            text += str[index];
        }
        return arr;
    });

    return result;
};

// const text = formatHtmlString(
//     "<h2>Can you drive alone at 16 in DC?</h2>\r\nYou can drive alone. If you are under 18 years old, you can drive with no more than 2 passengers under age 21. This restriction does not apply to passengers who are your siblings.\r\n<h2>How do I become a truck driver in BC?</h2>\r\nGet your commercial learner's licence. To get your learner's licence you'll need to study and pass a knowledge test. ... Step 1: Study. Read and study driving commercial vehicles. ... Step 2: Take your test(s) Book an appointment to take your test at an ICBC driver licensing office* ... About the commercial knowledge test.\r\n<h2>New rules for commercial driver's licenses</h2>\r\n<h2>How many questions are on the CDL permit test in DC?</h2>\r\n50 The District of Columbia CDL test consists of 50 questions. To pass, you must correctly answer at least 40 questions (80%). ... DC CDL Practice Test. Number of questions: 50 Correct answers to pass: 40 Passing score: 80%\r\n<h2>How do you get your CDL in DC?</h2>\r\nTo get a DC DMV CDL, you must: Have a valid non-commercial driver license (NCDL). Meet identity, residency, and good driving history eligibility qualifications. Take the applicable CDL knowledge tests. Get a CDL learner permit. Take Entry-Level Driver Training (ELDT) by an approved FMCSA training provider, if required. More items...\r\n<h2>What age can you drive in DC?</h2>\r\nYou must be at least 16 years old to get a DC DMV learner permit, and you must pass vision screening and knowledge tests and provide documentation that proves your identity, residency, and eligibility, among other things. DC DMV offers learners either a REAL ID or a Limited Purpose learner permit.\r\n<h2>New rules for those looking to get their first commercial driver license</h2>\r\n<h2>Can you drive by yourself with a provisional license in DC?</h2>\r\nObtaining a Provisional License The Provisional License allows teens to drive alone, with hour restrictions. In July and August, holders may drive from 6AM until midnight. Between September and June, teens are permitted to drive between 6AM and 11PM Monday through Thursday, and 6AM until midnight Friday through Sunday.\r\n<h2>How much do long haul truck drivers make in BC?</h2>\r\nThe average salary for a long haul driver is $50.06 per hour in Vancouver, BC.\r\n<h2>What is class 5 license BC?</h2>\r\nA BC Class 5 license is the final stage in becoming a completely certified British Columbia driver, but to get your Class 5 licence, you need to demonstrate that you are a capable, safe driver in any road or weather conditions.\r\n<h2>New Commercial Drivers License Training Requirements Now In Effect</h2>\r\n<h2>What is Class 3 license BC?</h2>\r\nThe BC Class 3 license is a commercial driver's license that allows you to drive: trucks with more than two axles, such as dump trucks and large tow trucks but does not allow driving a bus carrying passengers. a tow car towing a vehicle of any weight.\r\n<h2>What happens if you fail CDL permit test?</h2>\r\nFailing either the written or driving portion of the CDL exam will mean that you have to wait three full days before you are eligible to retake the test. You can take your test again on the fourth day or wait as long as you would like to feel prepared. Mar 20, 2018\r\n<h2>How do I get my CDL permit in VA?</h2>\r\nTo obtain a CDL or commercial learner's permit (CLP) in Virginia, you must meet all requirements for a Virginia driver's license. You may hold either a driver's license or a CDL, but not both. You must apply for your CDL or CLP in person at a DMV customer service center.\r\n<h2>2020 CDL California DMV Written Test - Knowledge Test Class A #1</h2>\r\n<h2>How much does a CDL cost in DC?</h2>\r\n$117 $47/8 years (Effective Oct 1, 2015) Commercial Driver License Service Fee Commercial Driver License (First-Time and Renewal) $117 Commercial Driver License Downgrade $20 Commercial Driver License Duplicate $20 Commercial Driver License Endorsement $20 3 more rows\r\n<h2>How much is a CDL license?</h2>\r\nAs we discussed in our previous article, CDL tuition can range from $1,500 to $8,000. Combined with the other costs described above, obtaining your CDL can cost up to $9,000. These costs all depend on the location of your licensing and your training. Oct 28, 2020\r\n<h2>How long does it take to get a CDL?</h2>\r\nOn average, it takes about seven weeks to get your CDL (commercial driver's license) when attending a full-time driver training program. The length of time it takes to get your CDL relies on a handful of factors. It can take as little as three weeks or upwards of six months. Oct 12, 2018"
// );
// console.log(text);
exports.formatHtmlString = formatHtmlString;
