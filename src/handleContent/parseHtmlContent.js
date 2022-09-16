const { convert } = require("html-to-text");
const { LINK_TYPE, IMAGE_TYPE, TEXT_TYPE } = require("../utils/constant");

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
                builder.addInline('"data":');
                builder.addInline(`"${elem.attribs.src}"`);
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
        ],
    });
    return text.split("\n");
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
                        type: TEXT_TYPE,
                        data: text,
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


// const text = formatHtmlString("<span style=\"font-weight: 400;\">In the process of searching for online tutoring positions, you cannot skip the resume preparation step. A resume is one of the important things you need to pay attention to and it is decisive in affecting the results of your job search. With a good resume, you will surely get more opportunities</span>\r\n\r\n<span style=\"font-weight: 400;\">Remember to mention your relevant work experience and abilities in relation to the position you are seeking while composing your <strong>online tutor resume</strong>. Presenting your relevant accomplishments on your resume will help you stand out and land that job interview, regardless of whether you're looking for a new job or have been working for a while.</span>\r\n\r\n<span style=\"font-weight: 400;\">This resume template is a great illustration of what employers look for in an <strong>Online Tutor Resume</strong>. Feel free to use this example as inspiration as you write your own resume or use this simple resume builder, which will walk you through the process step by step in minutes.</span>\r\n\r\n<img class=\"wp-image-1455 aligncenter\" src=\"http://pbn.passemall.com/wp-content/uploads/2022/09/tutor-v1-233x300.png\" alt=\"online tutor resume\" width=\"626\" height=\"806\" />\r\n<h2><strong>What is an online tutor?</strong></h2>\r\nStudents are instructed by an online tutor in a virtual setting. The tutor creates educational materials, such as video lessons, while working remotely to stress topics that the students are interested in learning. The tutor provides feedback and emphasizes the essentials in order to motivate pupils to meet their academic objectives. Students in elementary school through college can work with online tutors.\r\n<h2 class=\"rich-text-component css-tvmuer e1tiznh50\"><strong>How to write an online tutor resume?</strong></h2>\r\nThe methods listed below show you how to create an online tutor CV.\r\n<h3><strong>Review the job description</strong></h3>\r\nThe job description for the role of online tutor outlines the employer's requirements. It can be vital to customize your CV for each job you apply for because various employers may have different criteria. Consider your work background and emphasize the skills that are most relevant to online education. Make the hiring manager want to read your resume by keeping the material to one page and keeping it concise.\r\nLook over the posting to find the qualities that most accurately reflect you, then add them to the paper. For instance, if the business is looking for a candidate with technological expertise, you can mention the software programs you are familiar with.\r\n<h3><strong>Add your contact information</strong></h3>\r\nYour contact information is used by employers to update you on the progress of your job application. Your first and last names should be written at the top of the paper. On the next line, include a contact number and a formal email address. Additionally, you might mention the state and city where you work. Include a link to the website if your credentials are discussed in an online teaching portfolio or employment profile.\r\n<h3><strong>Compose a formal summary</strong></h3>\r\nA professional summary gives a two- to three-sentence outline of your qualifications. Its goal is to grab the hiring manager's attention and highlight your qualifications for working as an online tutor. In order to reflect favorably on yourself as a job prospect, you might quantify the number of years you have worked in virtual teaching and utilize adverbs like \"skilled\" and \"reliable.\" Describe your accomplishments and what you expect to bring to the firm if hired. In the summary, don't forget to include the employer and the position you're looking for.\r\n<h3><strong>References from previous employers</strong></h3>\r\nYour prior employment is discussed in the work experience section. Give the roles that will help you be an online tutor the highest priority. Write the job title of your prior position together with the month and year you began and ended your employment in that position in a subheading. Enter the name and location of the business you formerly worked for. Next, list the crucial tasks you did in a bulleted list format. Put an emphasis on exercises that demonstrate abilities important for online instruction, such as organization, time management, and communication. List your previous positions in reverse chronological order, starting with your current role.\r\n<h3><strong>Recognize your abilities</strong></h3>\r\nEmployers look over your skills section to see if you can carry out the responsibilities of an online tutor. Utilizing a combination of soft and hard abilities, compile a list of pertinent traits. To demonstrate your suitability for your chosen role, express your skills in the same manner as the job description. Write the employer's exact wording in the abilities area of your resume, for instance, if directing tutoring sessions is described as having \"instructional leadership.\"\r\n\r\nThe article gives you information about <strong>online tutor resume</strong>, hope it is useful for you.\r\n\r\nhttps://www.youtube.com/watch?v=2n9r5LkJOOE&amp;t=1s")
// console.log(text);
exports.formatHtmlString = formatHtmlString;
