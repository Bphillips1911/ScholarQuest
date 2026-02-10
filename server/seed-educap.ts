import { db } from "./db";
import { acapStandards, acapBlueprints, acapItems, acapAssessments, acapAssignments, scholars, teacherAuth } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { seedInsightStack } from "./seed-insightstack";

export async function seedEducapData(): Promise<void> {
  console.log("EDUCAP SEED: Checking EduCAP data...");

  try {
    const existingStandards = await db.select({ id: acapStandards.id }).from(acapStandards).where(eq(acapStandards.isActive, true));
    const existingBlueprints = await db.select({ id: acapBlueprints.id }).from(acapBlueprints).where(eq(acapBlueprints.isActive, true));
    const existingItems = await db.select({ id: acapItems.id }).from(acapItems);
    const existingAssessments = await db.select({ id: acapAssessments.id }).from(acapAssessments);

    console.log(`EDUCAP SEED: Current counts - Standards: ${existingStandards.length}, Blueprints: ${existingBlueprints.length}, Items: ${existingItems.length}, Assessments: ${existingAssessments.length}`);

    const existingAssignmentsCheck = await db.select({ id: acapAssignments.id }).from(acapAssignments);

    if (existingStandards.length >= 128 && existingBlueprints.length >= 6 && existingItems.length >= 15) {
      await seedAssessments();
      if (existingAssignmentsCheck.length === 0) {
        await seedAssignments();
      }
      console.log("EDUCAP SEED: All data present. Verified assessments and assignments.");
      await seedInsightStack();
      return;
    }

    if (existingStandards.length < 128) {
      await seedStandards();
    }

    if (existingBlueprints.length < 6) {
      await seedBlueprints();
    }

    if (existingItems.length < 15) {
      await seedItems();
    }

    if (existingAssessments.length < 1) {
      await seedAssessments();
    }

    await seedAssignments();

    const finalStandards = await db.select({ id: acapStandards.id }).from(acapStandards).where(eq(acapStandards.isActive, true));
    const finalBlueprints = await db.select({ id: acapBlueprints.id }).from(acapBlueprints).where(eq(acapBlueprints.isActive, true));
    const finalItems = await db.select({ id: acapItems.id }).from(acapItems);
    const finalAssessments = await db.select({ id: acapAssessments.id }).from(acapAssessments);
    const finalAssignments = await db.select({ id: acapAssignments.id }).from(acapAssignments);
    console.log(`EDUCAP SEED: Final counts - Standards: ${finalStandards.length}, Blueprints: ${finalBlueprints.length}, Items: ${finalItems.length}, Assessments: ${finalAssessments.length}, Assignments: ${finalAssignments.length}`);

    await seedInsightStack();
  } catch (error: any) {
    console.error("EDUCAP SEED: Error during seeding:", error.message);
  }
}

async function seedStandards() {
  console.log("EDUCAP SEED: Seeding standards...");

  const standards = [
    { code: "6.CL.2", domain: "ELA", subdomain: "Critical Literacy - Reading", gradeLevel: 6, description: "Make inferences and draw logical conclusions from the content and structures of informational texts, including comparison and contrast, problem and solution, claims and evidence, cause and effect.", dokLevels: [3, 4], isActive: true },
    { code: "6.CL.3", domain: "ELA", subdomain: "Critical Literacy - Reading", gradeLevel: 6, description: "Explain how authors use setting, plot, characters, theme, conflict, dialogue, and point of view to contribute to the meaning and purpose of prose and poetry.", dokLevels: [2, 3, 4], isActive: true },
    { code: "6.CL.4", domain: "ELA", subdomain: "Critical Literacy - Reading", gradeLevel: 6, description: "Describe the use of literary devices in prose and poetry, including simile, metaphor, personification, onomatopoeia, hyperbole, tone, imagery, irony, symbolism, and mood.", dokLevels: [2, 3], isActive: true },
    { code: "6.CL.7", domain: "ELA", subdomain: "Critical Literacy - Writing", gradeLevel: 6, description: "Produce clear, coherent narrative, argument, and informative/explanatory writing in which the development, organization, style, and tone are relevant to task, purpose, and audience.", dokLevels: [3, 4], isActive: true },
    { code: "6.DL.10", domain: "ELA", subdomain: "Digital Literacy", gradeLevel: 6, description: "Determine subject, occasion, audience, purpose, tone, and credibility of digital sources.", dokLevels: [2, 3], isActive: true },
    { code: "6.DL.11", domain: "ELA", subdomain: "Digital Literacy", gradeLevel: 6, description: "Utilize written, visual, digital, and interactive texts to generate and answer literal, interpretive, and applied questions.", dokLevels: [2, 3, 4], isActive: true },
    { code: "6.DL.13", domain: "ELA", subdomain: "Digital Literacy - Writing", gradeLevel: 6, description: "Create and edit digital products that are appropriate in subject and purpose for a particular audience or occasion.", dokLevels: [3, 4], isActive: true },
    { code: "6.LL.15", domain: "ELA", subdomain: "Language Literacy", gradeLevel: 6, description: "Identify the conventions of standard English grammar and usage in published texts, including subject-verb agreement and pronoun usage.", dokLevels: [2, 3], isActive: true },
    { code: "6.LL.16", domain: "ELA", subdomain: "Language Literacy", gradeLevel: 6, description: "Identify the conventions of standard English capitalization, punctuation, and spelling in published texts.", dokLevels: [2, 3], isActive: true },
    { code: "6.LL.19", domain: "ELA", subdomain: "Language Literacy - Writing", gradeLevel: 6, description: "Demonstrate command of standard English grammar, usage, and mechanics when writing.", dokLevels: [2, 3, 4], isActive: true },
    { code: "6.RL.21", domain: "ELA", subdomain: "Research Literacy", gradeLevel: 6, description: "Summarize ethical guidelines and explain how they govern the process of finding and recording information from primary, secondary, and digital sources.", dokLevels: [2, 3], isActive: true },
    { code: "6.RL.22", domain: "ELA", subdomain: "Research Literacy", gradeLevel: 6, description: "Assess the relevance, reliability, and validity of information from printed and/or digital texts.", dokLevels: [3, 4], isActive: true },
    { code: "6.RL.24", domain: "ELA", subdomain: "Research Literacy - Writing", gradeLevel: 6, description: "Write about research findings independently over short and/or extended periods of time.", dokLevels: [3, 4], isActive: true },
    { code: "6.RL.25", domain: "ELA", subdomain: "Research Literacy - Writing", gradeLevel: 6, description: "Quote, paraphrase, and summarize information from sources and present findings, following an appropriate citation style.", dokLevels: [2, 3, 4], isActive: true },
    { code: "6.VL.27", domain: "ELA", subdomain: "Vocabulary Literacy", gradeLevel: 6, description: "Discover word meanings by analyzing word parts, examining connotation and denotation, or using print or digital reference tools.", dokLevels: [2, 3], isActive: true },
    { code: "6.VL.29", domain: "ELA", subdomain: "Vocabulary Literacy - Writing", gradeLevel: 6, description: "Use academic vocabulary in writing to communicate effectively.", dokLevels: [2, 3], isActive: true },
    { code: "6.AF.14", domain: "Math", subdomain: "Algebra and Functions", gradeLevel: 6, description: "Write, evaluate, and compare expressions involving whole number exponents.", dokLevels: [2, 3], isActive: true },
    { code: "6.AF.15", domain: "Math", subdomain: "Algebra and Functions", gradeLevel: 6, description: "Write, read, and evaluate expressions in which letters represent numbers in real-world contexts.", dokLevels: [2, 3, 4], isActive: true },
    { code: "6.AF.16", domain: "Math", subdomain: "Algebra and Functions", gradeLevel: 6, description: "Generate equivalent algebraic expressions using the properties of operations, including inverse, identity, commutative, associative, and distributive.", dokLevels: [2, 3], isActive: true },
    { code: "6.AF.17", domain: "Math", subdomain: "Algebra and Functions", gradeLevel: 6, description: "Determine whether two expressions are equivalent and justify the reasoning.", dokLevels: [3, 4], isActive: true },
    { code: "6.AF.18", domain: "Math", subdomain: "Algebra and Functions", gradeLevel: 6, description: "Determine whether a value is a solution to an equation or inequality by using substitution to conclude whether a given value makes the equation or inequality true.", dokLevels: [2, 3], isActive: true },
    { code: "6.AF.19", domain: "Math", subdomain: "Algebra and Functions", gradeLevel: 6, description: "Write and solve an equation in the form of x+p=q or px=q for cases in which p, q, and x are all non-negative rational numbers to solve real-world and mathematical problems.", dokLevels: [2, 3, 4], isActive: true },
    { code: "6.AF.20", domain: "Math", subdomain: "Algebra and Functions", gradeLevel: 6, description: "Write and solve inequalities in the form of x>c, x<c, x>=c, or x<=c to represent a constraint or condition in a real-world or mathematical problem.", dokLevels: [2, 3], isActive: true },
    { code: "6.AF.21", domain: "Math", subdomain: "Algebra and Functions", gradeLevel: 6, description: "Identify, represent, and analyze two quantities that change in relationship to one another in real-world or mathematical situations.", dokLevels: [3, 4], isActive: true },
    { code: "6.DSP.22", domain: "Math", subdomain: "Data Analysis and Statistics", gradeLevel: 6, description: "Write examples and non-examples of statistical questions, explaining that a statistical question anticipates variability in the data related to the question.", dokLevels: [2, 3], isActive: true },
    { code: "6.DSP.23", domain: "Math", subdomain: "Data Analysis and Statistics", gradeLevel: 6, description: "Calculate, interpret, and compare measures of center (mean, median, mode) and variability (range and interquartile range) in real-world data sets.", dokLevels: [2, 3, 4], isActive: true },
    { code: "6.DSP.24", domain: "Math", subdomain: "Data Analysis and Statistics", gradeLevel: 6, description: "Represent numerical data graphically, using dot plots, line plots, histograms, stem and leaf plots, and box plots.", dokLevels: [2, 3], isActive: true },
    { code: "6.GM.25", domain: "Math", subdomain: "Geometry and Measurement", gradeLevel: 6, description: "Graph polygons in the coordinate plane given coordinates of the vertices to solve real-world and mathematical problems.", dokLevels: [2, 3, 4], isActive: true },
    { code: "6.GM.26", domain: "Math", subdomain: "Geometry and Measurement", gradeLevel: 6, description: "Calculate the area of triangles, special quadrilaterals, and other polygons by composing and decomposing them into known shapes.", dokLevels: [2, 3], isActive: true },
    { code: "6.GM.27", domain: "Math", subdomain: "Geometry and Measurement", gradeLevel: 6, description: "Determine the surface area of three-dimensional figures by representing them with nets composed of rectangles and triangles to solve real-world and mathematical problems.", dokLevels: [2, 3, 4], isActive: true },
    { code: "6.GM.28", domain: "Math", subdomain: "Geometry and Measurement", gradeLevel: 6, description: "Apply previous understanding of volume of right rectangular prisms to those with fractional edge lengths to solve real-world and mathematical problems.", dokLevels: [2, 3], isActive: true },
    { code: "6.NS.4", domain: "Math", subdomain: "Number Systems and Operations", gradeLevel: 6, description: "Interpret and compute quotients of fractions using visual models and equations to represent problems.", dokLevels: [2, 3], isActive: true },
    { code: "6.NS.5", domain: "Math", subdomain: "Number Systems and Operations", gradeLevel: 6, description: "Fluently divide multi-digit whole numbers using a standard algorithm to solve real-world and mathematical problems.", dokLevels: [2, 3], isActive: true },
    { code: "6.NS.6", domain: "Math", subdomain: "Number Systems and Operations", gradeLevel: 6, description: "Add, subtract, multiply, and divide decimals using a standard algorithm.", dokLevels: [2, 3], isActive: true },
    { code: "6.NS.7", domain: "Math", subdomain: "Number Systems and Operations", gradeLevel: 6, description: "Use the distributive property to express the sum of two whole numbers with a common factor as a multiple of a sum of two whole numbers with no common factor.", dokLevels: [2, 3], isActive: true },
    { code: "6.NS.8", domain: "Math", subdomain: "Number Systems and Operations", gradeLevel: 6, description: "Find the greatest common factor (GCF) and least common multiple (LCM) of two or more whole numbers.", dokLevels: [2, 3], isActive: true },
    { code: "6.NS.9", domain: "Math", subdomain: "Number Systems and Operations", gradeLevel: 6, description: "Use signed numbers to describe quantities that have opposite directions or values and to represent quantities in real-world contexts.", dokLevels: [2, 3], isActive: true },
    { code: "6.NS.10", domain: "Math", subdomain: "Number Systems and Operations", gradeLevel: 6, description: "Locate integers and other rational numbers on a horizontal or vertical line diagram.", dokLevels: [2, 3], isActive: true },
    { code: "6.NS.11", domain: "Math", subdomain: "Number Systems and Operations", gradeLevel: 6, description: "Find the position of pairs of integers and other rational numbers on the coordinate plane.", dokLevels: [2, 3, 4], isActive: true },
    { code: "6.NS.12", domain: "Math", subdomain: "Number Systems and Operations", gradeLevel: 6, description: "Explain the meaning of absolute value and determine the absolute value of rational numbers in real-world contexts.", dokLevels: [2, 3], isActive: true },
    { code: "6.NS.13", domain: "Math", subdomain: "Number Systems and Operations", gradeLevel: 6, description: "Compare and order rational numbers and absolute value of rational numbers with and without a number line in order to solve real-world and mathematical problems.", dokLevels: [2, 3, 4], isActive: true },
    { code: "7.CL.1", domain: "ELA", subdomain: "Critical Literacy - Reading", gradeLevel: 7, description: "Evaluate the contributions of informational text elements, including categories, point of view, purpose, and figurative, connotative, and technical word meanings, to develop central and supporting ideas.", dokLevels: [2, 3, 4], isActive: true },
    { code: "7.CL.2", domain: "ELA", subdomain: "Critical Literacy - Reading", gradeLevel: 7, description: "Evaluate how effectively an author uses structures of informational texts, including comparison and contrast, problem and solution, cause and effect, and substantiated or unsubstantiated claims.", dokLevels: [3, 4], isActive: true },
    { code: "7.CL.3", domain: "ELA", subdomain: "Critical Literacy - Reading", gradeLevel: 7, description: "Explain how the author's choice of setting, plot, characters, theme, conflict, dialogue, and point of view contribute to and/or enhance the meaning and purpose of prose and poetry.", dokLevels: [2, 3, 4], isActive: true },
    { code: "7.CL.4", domain: "ELA", subdomain: "Critical Literacy - Reading", gradeLevel: 7, description: "Evaluate literary devices to support interpretations of literary texts using textual evidence, including simile, metaphor, personification, onomatopoeia, hyperbole, imagery, tone, symbolism, irony, and mood.", dokLevels: [3, 4], isActive: true },
    { code: "7.CL.7", domain: "ELA", subdomain: "Critical Literacy - Writing", gradeLevel: 7, description: "Produce clear, coherent narrative, argument, and informative/explanatory writing in which the development, organization, style, and tone are relevant to task, purpose, and audience.", dokLevels: [3, 4], isActive: true },
    { code: "7.DL.10", domain: "ELA", subdomain: "Digital Literacy", gradeLevel: 7, description: "Assess subject, occasion, audience, purpose, tone, and credibility of various digital sources.", dokLevels: [2, 3], isActive: true },
    { code: "7.DL.11", domain: "ELA", subdomain: "Digital Literacy", gradeLevel: 7, description: "Compare and contrast the effectiveness of techniques used in a variety of digital sources to generate and answer literal, interpretive, and applied questions.", dokLevels: [3, 4], isActive: true },
    { code: "7.DL.14", domain: "ELA", subdomain: "Digital Literacy - Writing", gradeLevel: 7, description: "Create and edit digital products that are appropriate in subject, occasion, audience, purpose, and tone.", dokLevels: [3, 4], isActive: true },
    { code: "7.LL.17", domain: "ELA", subdomain: "Language Literacy", gradeLevel: 7, description: "Identify the conventions of standard English grammar and usage in writing, including subject-verb agreement with compound subjects and collective nouns.", dokLevels: [2, 3], isActive: true },
    { code: "7.LL.18", domain: "ELA", subdomain: "Language Literacy", gradeLevel: 7, description: "Identify the conventions of standard English capitalization, punctuation, and spelling in a variety of texts.", dokLevels: [2, 3], isActive: true },
    { code: "7.LL.21", domain: "ELA", subdomain: "Language Literacy - Writing", gradeLevel: 7, description: "Create written work using standard English grammar, usage, and mechanics. Construct simple, compound, complex, and compound-complex sentences.", dokLevels: [2, 3, 4], isActive: true },
    { code: "7.RL.23", domain: "ELA", subdomain: "Research Literacy", gradeLevel: 7, description: "Implement ethical guidelines while finding and recording information from a variety of primary, secondary, and digital sources.", dokLevels: [2, 3], isActive: true },
    { code: "7.RL.24", domain: "ELA", subdomain: "Research Literacy", gradeLevel: 7, description: "Determine the relevance, reliability, and validity of information from nonfiction and fictional printed and/or digital texts.", dokLevels: [3, 4], isActive: true },
    { code: "7.RL.26", domain: "ELA", subdomain: "Research Literacy - Writing", gradeLevel: 7, description: "Produce research writings over extended periods with time for research, reflection, and revision and within shorter time frames.", dokLevels: [3, 4], isActive: true },
    { code: "7.RL.27", domain: "ELA", subdomain: "Research Literacy - Writing", gradeLevel: 7, description: "Quote, paraphrase, summarize, and present findings, following an appropriate citation style and avoiding plagiarism.", dokLevels: [2, 3, 4], isActive: true },
    { code: "7.VL.29", domain: "ELA", subdomain: "Vocabulary Literacy", gradeLevel: 7, description: "Determine word meaning through the use of word parts, context clues, connotation and denotation, or print or digital reference tools.", dokLevels: [2, 3], isActive: true },
    { code: "7.VL.30", domain: "ELA", subdomain: "Vocabulary Literacy", gradeLevel: 7, description: "Read and evaluate texts from science, social studies, and other academic disciplines to determine how those disciplines treat domain-specific vocabulary.", dokLevels: [2, 3, 4], isActive: true },
    { code: "7.VL.32", domain: "ELA", subdomain: "Vocabulary Literacy - Writing", gradeLevel: 7, description: "Apply vocabulary in writing to convey and enhance meaning.", dokLevels: [2, 3], isActive: true },
    { code: "7.AF.6", domain: "Math", subdomain: "Algebra and Functions", gradeLevel: 7, description: "Apply properties of operations as strategies to add, subtract, factor, and expand linear expressions with rational coefficients.", dokLevels: [2, 3], isActive: true },
    { code: "7.AF.7", domain: "Math", subdomain: "Algebra and Functions", gradeLevel: 7, description: "Generate expressions in equivalent forms based on context and explain how the quantities are related.", dokLevels: [3, 4], isActive: true },
    { code: "7.AF.8", domain: "Math", subdomain: "Algebra and Functions", gradeLevel: 7, description: "Solve multi-step real-world and mathematical problems involving rational numbers (integers, signed fractions and decimals), converting between forms as needed. Assess the reasonableness of answers using mental computation and estimation strategies.", dokLevels: [2, 3, 4], isActive: true },
    { code: "7.AF.9", domain: "Math", subdomain: "Algebra and Functions", gradeLevel: 7, description: "Use variables to represent quantities in real-world or mathematical problems and construct algebraic expressions, equations, and inequalities to solve problems by reasoning about the quantities.", dokLevels: [3, 4], isActive: true },
    { code: "7.DSP.10", domain: "Math", subdomain: "Data Analysis and Statistics", gradeLevel: 7, description: "Examine a sample of a population to generalize information about the population.", dokLevels: [2, 3, 4], isActive: true },
    { code: "7.DSP.11", domain: "Math", subdomain: "Data Analysis and Statistics", gradeLevel: 7, description: "Informally assess the degree of visual overlap of two numerical data distributions with similar variabilities, measuring the difference between the centers by expressing it as a multiple of a measure of variability.", dokLevels: [3, 4], isActive: true },
    { code: "7.DSP.12", domain: "Math", subdomain: "Data Analysis and Statistics", gradeLevel: 7, description: "Make informal comparative inferences about two populations using measures of center and variability and/or mean absolute deviation in context.", dokLevels: [3, 4], isActive: true },
    { code: "7.DSP.13", domain: "Math", subdomain: "Probability", gradeLevel: 7, description: "Use a number from 0 to 1 to represent the probability of a chance event occurring, explaining that larger numbers indicate greater likelihood of the event occurring.", dokLevels: [2, 3], isActive: true },
    { code: "7.DSP.14", domain: "Math", subdomain: "Probability", gradeLevel: 7, description: "Define and develop a probability model, including models that may or may not be uniform, where uniform models assign equal probability to all outcomes.", dokLevels: [2, 3, 4], isActive: true },
    { code: "7.DSP.15", domain: "Math", subdomain: "Probability", gradeLevel: 7, description: "Approximate the probability of an event using data generated by a simulation (experimental probability) and compare it to the theoretical probability.", dokLevels: [3, 4], isActive: true },
    { code: "7.DSP.16", domain: "Math", subdomain: "Probability", gradeLevel: 7, description: "Find probabilities of simple and compound events through experimentation or simulation and by analyzing the sample space, representing the probabilities as percents, decimals, or fractions.", dokLevels: [2, 3, 4], isActive: true },
    { code: "7.GM.17", domain: "Math", subdomain: "Geometry and Measurement", gradeLevel: 7, description: "Solve problems involving scale drawings of geometric figures, including computation of actual lengths and areas from a scale drawing and reproduction of a scale drawing at a different scale.", dokLevels: [2, 3, 4], isActive: true },
    { code: "7.GM.18", domain: "Math", subdomain: "Geometry and Measurement", gradeLevel: 7, description: "Construct geometric shapes (freehand, using a ruler and a protractor, and using technology), given a written description or measurement constraints with emphasis on constructing triangles.", dokLevels: [2, 3], isActive: true },
    { code: "7.GM.20", domain: "Math", subdomain: "Geometry and Measurement", gradeLevel: 7, description: "Explain the relationships among circumference, diameter, area, and radius of a circle to demonstrate understanding of formulas for the area and circumference of a circle.", dokLevels: [2, 3, 4], isActive: true },
    { code: "7.GM.21", domain: "Math", subdomain: "Geometry and Measurement", gradeLevel: 7, description: "Use facts about supplementary, complementary, vertical, and adjacent angles in multi-step problems to write and solve simple equations for an unknown angle in a figure.", dokLevels: [2, 3], isActive: true },
    { code: "7.PR.1", domain: "Math", subdomain: "Proportional Reasoning", gradeLevel: 7, description: "Calculate unit rates of length, area, and other quantities measured in like or different units that include ratios or fractions.", dokLevels: [2, 3], isActive: true },
    { code: "7.PR.2", domain: "Math", subdomain: "Proportional Reasoning", gradeLevel: 7, description: "Represent a relationship between two quantities and determine whether the two quantities are related proportionally.", dokLevels: [2, 3, 4], isActive: true },
    { code: "7.PR.3", domain: "Math", subdomain: "Proportional Reasoning", gradeLevel: 7, description: "Solve multi-step percent problems in context, including simple interest, tax, markups and markdowns, gratuities and commissions, fees, and percent increase and decrease.", dokLevels: [2, 3, 4], isActive: true },
    { code: "7.PR.4", domain: "Math", subdomain: "Proportional Reasoning", gradeLevel: 7, description: "Use proportional relationships to solve multi-step ratio and percent problems.", dokLevels: [2, 3, 4], isActive: true },
    { code: "7.PR.5", domain: "Math", subdomain: "Proportional Reasoning", gradeLevel: 7, description: "Graph proportional relationships, interpreting the unit rate as the slope of the graph.", dokLevels: [2, 3], isActive: true },
    { code: "8.CL.1", domain: "ELA", subdomain: "Critical Literacy - Reading", gradeLevel: 8, description: "Evaluate the relevance and sufficiency of evidence offered in support of a claim.", dokLevels: [3, 4], isActive: true },
    { code: "8.CL.2", domain: "ELA", subdomain: "Critical Literacy - Reading", gradeLevel: 8, description: "Analyze how authors use key literary elements to contribute to meaning and interpret how themes are connected across texts.", dokLevels: [3, 4], isActive: true },
    { code: "8.CL.3", domain: "ELA", subdomain: "Critical Literacy - Reading", gradeLevel: 8, description: "Analyze how the author's use of literary devices achieves specific purposes and effects in prose and poetry.", dokLevels: [3, 4], isActive: true },
    { code: "8.CL.4", domain: "ELA", subdomain: "Critical Literacy - Reading", gradeLevel: 8, description: "Analyze and evaluate how an author uses rhetoric and word choice (including figurative, connotative, and technical word meanings) to advance the purpose of a text.", dokLevels: [3, 4], isActive: true },
    { code: "8.CL.7", domain: "ELA", subdomain: "Critical Literacy - Writing", gradeLevel: 8, description: "Produce clear, coherent narrative, argument, and informative/explanatory writing with development, organization, style, and tone appropriate to task, purpose, and audience.", dokLevels: [3, 4], isActive: true },
    { code: "8.DL.10", domain: "ELA", subdomain: "Digital Literacy", gradeLevel: 8, description: "Evaluate subject, occasion, audience, purpose, effectiveness, and tone of digitally presented information.", dokLevels: [2, 3, 4], isActive: true },
    { code: "8.DL.11", domain: "ELA", subdomain: "Digital Literacy", gradeLevel: 8, description: "Synthesize information from a variety of digital sources to generate questions and answer literal, interpretive, and applied questions.", dokLevels: [3, 4], isActive: true },
    { code: "8.DL.14", domain: "ELA", subdomain: "Digital Literacy - Writing", gradeLevel: 8, description: "Create, publish, and edit digital products that are appropriate in subject, occasion, audience, purpose, and tone.", dokLevels: [3, 4], isActive: true },
    { code: "8.LL.17", domain: "ELA", subdomain: "Language Literacy", gradeLevel: 8, description: "Explain how authors use grammar and language conventions to convey meaning and style.", dokLevels: [2, 3, 4], isActive: true },
    { code: "8.LL.18", domain: "ELA", subdomain: "Language Literacy", gradeLevel: 8, description: "Evaluate and correct errors in standard English capitalization, punctuation, and spelling.", dokLevels: [2, 3], isActive: true },
    { code: "8.LL.21", domain: "ELA", subdomain: "Language Literacy - Writing", gradeLevel: 8, description: "Apply knowledge of grammar, usage, and mechanics to enhance writing. Construct and restructure sentences for effect.", dokLevels: [2, 3, 4], isActive: true },
    { code: "8.RL.23", domain: "ELA", subdomain: "Research Literacy", gradeLevel: 8, description: "Independently apply ethical guidelines when finding and recording information from primary, secondary, and digital sources.", dokLevels: [2, 3], isActive: true },
    { code: "8.RL.24", domain: "ELA", subdomain: "Research Literacy", gradeLevel: 8, description: "Evaluate the relevance, reliability, and validity of information from printed and/or digital texts.", dokLevels: [3, 4], isActive: true },
    { code: "8.RL.26", domain: "ELA", subdomain: "Research Literacy - Writing", gradeLevel: 8, description: "Produce research writings independently over extended periods and within shorter time frames.", dokLevels: [3, 4], isActive: true },
    { code: "8.RL.27", domain: "ELA", subdomain: "Research Literacy - Writing", gradeLevel: 8, description: "Integrate quotations, paraphrases, and summaries from sources into writing, correctly citing sources and avoiding plagiarism.", dokLevels: [2, 3, 4], isActive: true },
    { code: "8.VL.29", domain: "ELA", subdomain: "Vocabulary Literacy", gradeLevel: 8, description: "Analyze word meanings by examining word parts, relationships between words, and context to determine precise meaning.", dokLevels: [2, 3], isActive: true },
    { code: "8.VL.30", domain: "ELA", subdomain: "Vocabulary Literacy", gradeLevel: 8, description: "Evaluate and analyze domain-specific vocabulary across science, social studies, and other academic disciplines.", dokLevels: [2, 3, 4], isActive: true },
    { code: "8.VL.32", domain: "ELA", subdomain: "Vocabulary Literacy - Writing", gradeLevel: 8, description: "Use precise vocabulary including academic and domain-specific words to enhance and clarify writing.", dokLevels: [2, 3], isActive: true },
    { code: "8.AF.6", domain: "Math", subdomain: "Algebra and Functions", gradeLevel: 8, description: "Apply the properties of integer exponents to generate equivalent numerical expressions.", dokLevels: [2, 3], isActive: true },
    { code: "8.AF.7", domain: "Math", subdomain: "Algebra and Functions", gradeLevel: 8, description: "Rewrite expressions involving radicals and rational exponents using the properties of exponents.", dokLevels: [2, 3], isActive: true },
    { code: "8.AF.8", domain: "Math", subdomain: "Algebra and Functions", gradeLevel: 8, description: "Use numbers expressed in scientific notation to estimate very large or very small quantities and to express how many times larger one is than the other.", dokLevels: [2, 3], isActive: true },
    { code: "8.AF.9", domain: "Math", subdomain: "Algebra and Functions", gradeLevel: 8, description: "Perform operations with numbers expressed in scientific notation, including problems where both decimal and scientific notation are used.", dokLevels: [2, 3, 4], isActive: true },
    { code: "8.AF.10", domain: "Math", subdomain: "Algebra and Functions", gradeLevel: 8, description: "Graph proportional relationships, interpreting the unit rate as the slope of the graph. Compare two different proportional relationships represented in different ways.", dokLevels: [2, 3, 4], isActive: true },
    { code: "8.AF.11", domain: "Math", subdomain: "Algebra and Functions", gradeLevel: 8, description: "Use similar triangles to explain why the slope m is the same between any two distinct points on a non-vertical line in the coordinate plane.", dokLevels: [3, 4], isActive: true },
    { code: "8.AF.12", domain: "Math", subdomain: "Algebra and Functions", gradeLevel: 8, description: "Determine the equation y=mx+b from a graph and determine the slope and y-intercept of a line.", dokLevels: [2, 3], isActive: true },
    { code: "8.AF.13", domain: "Math", subdomain: "Algebra and Functions", gradeLevel: 8, description: "Solve linear equations with rational number coefficients, including equations whose solutions require expanding expressions using the distributive property.", dokLevels: [2, 3, 4], isActive: true },
    { code: "8.AF.14", domain: "Math", subdomain: "Algebra and Functions", gradeLevel: 8, description: "Solve systems of two linear equations in two variables algebraically, and estimate solutions by graphing the equations.", dokLevels: [2, 3, 4], isActive: true },
    { code: "8.AF.15", domain: "Math", subdomain: "Algebra and Functions", gradeLevel: 8, description: "Understand that a function is a rule that assigns to each input exactly one output and that the graph of a function is the set of ordered pairs.", dokLevels: [2, 3], isActive: true },
    { code: "8.AF.16", domain: "Math", subdomain: "Algebra and Functions", gradeLevel: 8, description: "Compare properties of two functions each represented in a different way: algebraically, graphically, numerically in tables, or by verbal descriptions.", dokLevels: [3, 4], isActive: true },
    { code: "8.AF.17", domain: "Math", subdomain: "Algebra and Functions", gradeLevel: 8, description: "Define, interpret, and compare linear functions from equations, tables, and graphs.", dokLevels: [2, 3, 4], isActive: true },
    { code: "8.AF.18", domain: "Math", subdomain: "Algebra and Functions", gradeLevel: 8, description: "Construct a function to model a linear relationship between two quantities and determine the rate of change and initial value.", dokLevels: [3, 4], isActive: true },
    { code: "8.AF.19", domain: "Math", subdomain: "Algebra and Functions", gradeLevel: 8, description: "Describe qualitatively the functional relationship between two quantities by analyzing a graph, and sketch a graph that exhibits qualitative features.", dokLevels: [2, 3, 4], isActive: true },
    { code: "8.DSP.20", domain: "Math", subdomain: "Data Analysis and Statistics", gradeLevel: 8, description: "Construct and interpret scatter plots for bivariate measurement data to investigate patterns of association between two quantities.", dokLevels: [2, 3, 4], isActive: true },
    { code: "8.DSP.21", domain: "Math", subdomain: "Data Analysis and Statistics", gradeLevel: 8, description: "Informally fit a straight line for scatter plots that suggest a linear association, and informally assess model fit by judging closeness of data points to line.", dokLevels: [3, 4], isActive: true },
    { code: "8.DSP.22", domain: "Math", subdomain: "Data Analysis and Statistics", gradeLevel: 8, description: "Use the equation of a linear model to solve problems in context, interpreting slope and intercept.", dokLevels: [2, 3, 4], isActive: true },
    { code: "8.DSP.23", domain: "Math", subdomain: "Data Analysis and Statistics", gradeLevel: 8, description: "Construct and interpret a two-way table summarizing data on two categorical variables collected from the same subjects.", dokLevels: [2, 3], isActive: true },
    { code: "8.GM.24", domain: "Math", subdomain: "Geometry and Measurement", gradeLevel: 8, description: "Verify experimentally the properties of rotations, reflections, and translations.", dokLevels: [2, 3], isActive: true },
    { code: "8.GM.25", domain: "Math", subdomain: "Geometry and Measurement", gradeLevel: 8, description: "Understand congruence in terms of rigid motions, and use the definition to determine if two figures are congruent.", dokLevels: [2, 3, 4], isActive: true },
    { code: "8.GM.26", domain: "Math", subdomain: "Geometry and Measurement", gradeLevel: 8, description: "Describe the effect of dilations, translations, rotations, and reflections on two-dimensional figures using coordinates.", dokLevels: [2, 3], isActive: true },
    { code: "8.GM.27", domain: "Math", subdomain: "Geometry and Measurement", gradeLevel: 8, description: "Use informal arguments to establish facts about the angle sum and exterior angle of triangles, about angles created when parallel lines are cut by a transversal.", dokLevels: [2, 3, 4], isActive: true },
    { code: "8.GM.28", domain: "Math", subdomain: "Geometry and Measurement", gradeLevel: 8, description: "Explain a proof of the Pythagorean Theorem and its converse.", dokLevels: [3, 4], isActive: true },
    { code: "8.GM.29", domain: "Math", subdomain: "Geometry and Measurement", gradeLevel: 8, description: "Apply the Pythagorean Theorem to determine unknown side lengths in right triangles in real-world and mathematical problems in two and three dimensions.", dokLevels: [2, 3, 4], isActive: true },
    { code: "8.GM.30", domain: "Math", subdomain: "Geometry and Measurement", gradeLevel: 8, description: "Apply the Pythagorean Theorem to find the distance between two points in a coordinate system.", dokLevels: [2, 3], isActive: true },
    { code: "8.GM.31", domain: "Math", subdomain: "Geometry and Measurement", gradeLevel: 8, description: "Informally derive the formulas for the volume of cones, cylinders, and spheres and use them to solve real-world and mathematical problems.", dokLevels: [2, 3, 4], isActive: true },
    { code: "8.NS.1", domain: "Math", subdomain: "Number Systems and Operations", gradeLevel: 8, description: "Define irrational numbers and approximate them by rational numbers.", dokLevels: [2, 3], isActive: true },
    { code: "8.NS.2", domain: "Math", subdomain: "Number Systems and Operations", gradeLevel: 8, description: "Use rational approximations of irrational numbers to compare the size of irrational numbers, locate them approximately on a number line diagram.", dokLevels: [2, 3], isActive: true },
  ];

  for (const std of standards) {
    const existing = await db.select({ id: acapStandards.id }).from(acapStandards).where(eq(acapStandards.code, std.code));
    if (existing.length === 0) {
      await db.insert(acapStandards).values(std);
    } else {
      await db.update(acapStandards).set({ isActive: true }).where(eq(acapStandards.code, std.code));
    }
  }

  const count = await db.select({ id: acapStandards.id }).from(acapStandards).where(eq(acapStandards.isActive, true));
  console.log(`EDUCAP SEED: Seeded/verified ${count.length} active standards`);
}

async function seedBlueprints() {
  console.log("EDUCAP SEED: Seeding blueprints...");

  const blueprints = [
    { name: "Grade 6 Math Assessment Blueprint", gradeLevel: 6, subject: "Math", standardIds: [], dokDistribution: { dok2: 30, dok3: 50, dok4: 20 }, totalItems: 20, timeLimitMinutes: 45, isActive: true },
    { name: "Grade 6 ELA Assessment Blueprint", gradeLevel: 6, subject: "ELA", standardIds: [], dokDistribution: { dok2: 20, dok3: 50, dok4: 30 }, totalItems: 20, timeLimitMinutes: 60, isActive: true },
    { name: "Grade 7 Math Assessment Blueprint", gradeLevel: 7, subject: "Math", standardIds: [], dokDistribution: { dok2: 30, dok3: 50, dok4: 20 }, totalItems: 20, timeLimitMinutes: 45, isActive: true },
    { name: "Grade 7 ELA Assessment Blueprint", gradeLevel: 7, subject: "ELA", standardIds: [], dokDistribution: { dok2: 20, dok3: 50, dok4: 30 }, totalItems: 20, timeLimitMinutes: 60, isActive: true },
    { name: "Grade 8 Math Assessment Blueprint", gradeLevel: 8, subject: "Math", standardIds: [], dokDistribution: { dok2: 20, dok3: 50, dok4: 30 }, totalItems: 25, timeLimitMinutes: 55, isActive: true },
    { name: "Grade 8 ELA Assessment Blueprint", gradeLevel: 8, subject: "ELA", standardIds: [], dokDistribution: { dok2: 20, dok3: 40, dok4: 40 }, totalItems: 20, timeLimitMinutes: 60, isActive: true },
  ];

  for (const bp of blueprints) {
    const existing = await db.select({ id: acapBlueprints.id }).from(acapBlueprints).where(eq(acapBlueprints.name, bp.name));
    if (existing.length === 0) {
      await db.insert(acapBlueprints).values(bp);
    }
  }
  console.log("EDUCAP SEED: Blueprints seeded");
}

async function seedItems() {
  console.log("EDUCAP SEED: Seeding items...");

  const allStandards = await db.select().from(acapStandards).where(eq(acapStandards.isActive, true));
  const elaStandard = allStandards.find(s => s.domain === "ELA" && s.gradeLevel === 6);
  const mathStandard = allStandards.find(s => s.domain === "Math" && s.gradeLevel === 6);

  if (!elaStandard || !mathStandard) {
    console.log("EDUCAP SEED: Cannot seed items - no standards found");
    return;
  }

  const items = [
    { standardId: elaStandard.id, itemType: "multiple_choice", stem: "Read the sentence: 'The scientist meticulously analyzed the data, ensuring every detail was accurate.' Based on the context, what does the word 'meticulously' most likely mean?", options: [{ key: "A", text: "Carefully and precisely" }, { key: "B", text: "Quickly and efficiently" }, { key: "C", text: "Casually and informally" }, { key: "D", text: "Creatively and imaginatively" }], correctAnswer: "A", explanation: "The context emphasizes attention to detail, aligning with 'carefully and precisely.'", dokLevel: 3, difficulty: 0.5, reviewStatus: "approved" },
    { standardId: elaStandard.id, itemType: "multiple_choice", stem: "Read the sentence: 'The manager's tone was curt, leaving the team feeling unsettled.' Using connotation, what does the word 'curt' suggest about the manager's tone?", options: [{ key: "A", text: "Polite and supportive" }, { key: "B", text: "Brief and rude" }, { key: "C", text: "Encouraging and kind" }, { key: "D", text: "Confident and assertive" }], correctAnswer: "B", explanation: "The word 'curt' has a negative connotation, suggesting brief and impolite.", dokLevel: 3, difficulty: 0.5, reviewStatus: "approved" },
    { standardId: elaStandard.id, itemType: "multiple_choice", stem: "Which word part helps you understand the meaning of 'unpredictable' in the sentence: 'The weather has been so unpredictable lately that no one knows whether to bring an umbrella or sunscreen'?", options: [{ key: "A", text: "Prefix 'un-'" }, { key: "B", text: "Root 'predict'" }, { key: "C", text: "Suffix '-able'" }, { key: "D", text: "All of the above" }], correctAnswer: "D", explanation: "Understanding 'unpredictable' requires analyzing all its parts.", dokLevel: 3, difficulty: 0.5, reviewStatus: "approved" },
    { standardId: elaStandard.id, itemType: "multiple_choice", stem: "Read the sentence: 'The author's description of the countryside was vivid, painting a picture of lush green fields and sparkling blue streams.' Based on the context, what does the word 'vivid' most likely mean?", options: [{ key: "A", text: "Dull and lifeless" }, { key: "B", text: "Bright and clear" }, { key: "C", text: "Confusing and unclear" }, { key: "D", text: "Ordinary and plain" }], correctAnswer: "B", explanation: "The description implies vibrant imagery, aligning with 'bright and clear.'", dokLevel: 3, difficulty: 0.5, reviewStatus: "approved" },
    { standardId: elaStandard.id, itemType: "multiple_choice", stem: "Which tool would be most effective for determining the precise meaning of the word 'resilient'?", options: [{ key: "A", text: "A thesaurus" }, { key: "B", text: "A print dictionary" }, { key: "C", text: "An online dictionary with examples" }, { key: "D", text: "A grammar textbook" }], correctAnswer: "C", explanation: "An online dictionary with examples provides context and precise definitions.", dokLevel: 3, difficulty: 0.5, reviewStatus: "approved" },
    { standardId: elaStandard.id, itemType: "multiple_choice", stem: "Read the following passage: 'The sun dipped below the horizon, painting the sky with hues of orange and pink.' What is the implied mood of the passage?", options: [{ key: "A", text: "Serene and peaceful" }, { key: "B", text: "Chaotic and tense" }, { key: "C", text: "Excited and jubilant" }, { key: "D", text: "Mysterious and eerie" }], correctAnswer: "A", explanation: "The sunset imagery creates a calm and tranquil atmosphere.", dokLevel: 3, difficulty: 0.5, reviewStatus: "approved" },
    { standardId: elaStandard.id, itemType: "multiple_choice", stem: "Based on the digital infographic about water conservation, what is the main reason for reducing household water usage?", options: [{ key: "A", text: "To reduce utility bills for individuals" }, { key: "B", text: "To ensure water availability for future generations" }, { key: "C", text: "To decrease the amount of water treatment needed" }, { key: "D", text: "To reduce the risk of flooding in urban areas" }], correctAnswer: "B", explanation: "The infographic highlights conserving water for future generations.", dokLevel: 3, difficulty: 0.5, reviewStatus: "approved" },
    { standardId: elaStandard.id, itemType: "multiple_choice", stem: "After reading the article about renewable energy sources, which conclusion best supports the argument for increasing solar energy use?", options: [{ key: "A", text: "Solar panels are easy to install." }, { key: "B", text: "Solar energy is a sustainable and clean power source." }, { key: "C", text: "Solar panels are available in most hardware stores." }, { key: "D", text: "Solar energy requires minimal maintenance." }], correctAnswer: "B", explanation: "Option B aligns with the article's focus on sustainability and environmental benefits.", dokLevel: 3, difficulty: 0.5, reviewStatus: "approved" },
    { standardId: elaStandard.id, itemType: "multiple_choice", stem: "In the story, the protagonist faces a choice between helping a friend and completing a personal goal. How does this decision reveal the theme of sacrifice?", options: [{ key: "A", text: "It shows that personal goals are more important than others' needs." }, { key: "B", text: "It demonstrates the difficulty of balancing priorities." }, { key: "C", text: "It highlights the value of putting others before oneself." }, { key: "D", text: "It emphasizes the importance of achieving success." }], correctAnswer: "C", explanation: "The theme of sacrifice is best illustrated through prioritizing others' needs.", dokLevel: 3, difficulty: 0.5, reviewStatus: "approved" },
    { standardId: elaStandard.id, itemType: "multiple_choice", stem: "Examine the chart showing the effects of deforestation on local wildlife populations. Which inference is best supported by the data?", options: [{ key: "A", text: "Deforestation has no impact on wildlife." }, { key: "B", text: "Deforestation leads to a significant decline in wildlife populations." }, { key: "C", text: "Some species benefit from deforestation." }, { key: "D", text: "Wildlife populations remain stable despite deforestation." }], correctAnswer: "B", explanation: "The data shows a decline in wildlife populations as deforestation increases.", dokLevel: 3, difficulty: 0.5, reviewStatus: "approved" },
    { standardId: elaStandard.id, itemType: "multiple_choice", stem: "Based on the poem's imagery, how does the author convey the passage of time?", options: [{ key: "A", text: "By describing the changing seasons" }, { key: "B", text: "By listing specific hours of the day" }, { key: "C", text: "By using metaphors about clocks and calendars" }, { key: "D", text: "By showing the growth of a tree" }], correctAnswer: "A", explanation: "The poem relies on seasonal changes to illustrate the passage of time.", dokLevel: 3, difficulty: 0.5, reviewStatus: "approved" },
    { standardId: elaStandard.id, itemType: "multiple_choice", stem: "After watching the video on the water cycle, why is evaporation a key process in the cycle?", options: [{ key: "A", text: "It creates clouds in the atmosphere." }, { key: "B", text: "It moves water from land to the air." }, { key: "C", text: "It causes rain to fall to the ground." }, { key: "D", text: "It provides nutrients to plants." }], correctAnswer: "B", explanation: "Evaporation transfers water from the surface to the atmosphere.", dokLevel: 3, difficulty: 0.5, reviewStatus: "approved" },
    { standardId: elaStandard.id, itemType: "multiple_choice", stem: "How does the author develop the central idea in the informational article about recycling?", options: [{ key: "A", text: "By providing statistics on waste reduction" }, { key: "B", text: "By sharing personal stories of people who recycle" }, { key: "C", text: "By describing the process of recycling materials" }, { key: "D", text: "By explaining the history of recycling programs" }], correctAnswer: "A", explanation: "The central idea is supported through statistics on waste reduction.", dokLevel: 3, difficulty: 0.5, reviewStatus: "approved" },
    { standardId: elaStandard.id, itemType: "multiple_choice", stem: "What is the main purpose of the interactive timeline in the digital text about space exploration?", options: [{ key: "A", text: "To show how space technology has evolved over time" }, { key: "B", text: "To explain the physics behind space travel" }, { key: "C", text: "To highlight famous astronauts" }, { key: "D", text: "To compare space exploration to other scientific fields" }], correctAnswer: "A", explanation: "The interactive timeline shows the progression of space technology.", dokLevel: 3, difficulty: 0.5, reviewStatus: "approved" },
    { standardId: elaStandard.id, itemType: "multiple_choice", stem: "Based on the passage, what can be inferred about the character's motivation for climbing the mountain?", options: [{ key: "A", text: "The character wants to prove their physical strength." }, { key: "B", text: "The character seeks personal fulfillment." }, { key: "C", text: "The character is fulfilling a promise to a friend." }, { key: "D", text: "The character is participating in a competition." }], correctAnswer: "B", explanation: "The text suggests personal and introspective motivation.", dokLevel: 3, difficulty: 0.5, reviewStatus: "approved" },
  ];

  const existingItems = await db.select({ id: acapItems.id }).from(acapItems);
  if (existingItems.length >= 15) {
    console.log("EDUCAP SEED: Items already exist, skipping");
    return;
  }

  for (const item of items) {
    await db.insert(acapItems).values(item);
  }
  console.log(`EDUCAP SEED: Seeded ${items.length} items`);
}

async function seedAssessments() {
  console.log("EDUCAP SEED: Seeding assessments...");

  const existingAssessments = await db.select({ id: acapAssessments.id }).from(acapAssessments);
  if (existingAssessments.length >= 1) {
    const items = await db.select({ id: acapItems.id }).from(acapItems);
    const itemIds = items.map(i => i.id);
    if (itemIds.length > 0) {
      for (const assess of existingAssessments) {
        const fullAssess = await db.select().from(acapAssessments).where(eq(acapAssessments.id, assess.id));
        if (fullAssess[0] && (!fullAssess[0].itemIds || (fullAssess[0].itemIds as number[]).length === 0)) {
          await db.update(acapAssessments).set({ itemIds }).where(eq(acapAssessments.id, assess.id));
          console.log(`EDUCAP SEED: Updated assessment ${assess.id} with ${itemIds.length} item IDs`);
        }
      }
    }
    console.log("EDUCAP SEED: Assessments already exist, verified item IDs");
    return;
  }

  const items = await db.select({ id: acapItems.id }).from(acapItems);
  const itemIds = items.map(i => i.id);

  await db.insert(acapAssessments).values({
    title: "ELA Assessment Trial",
    assessmentType: "formative",
    gradeLevel: 6,
    subject: "ELA",
    itemIds: itemIds,
    timeLimitMinutes: 60,
    isActive: true,
  });

  console.log("EDUCAP SEED: Seeded 1 assessment");
}

async function seedAssignments() {
  console.log("EDUCAP SEED: Checking assignments...");

  const existingAssignments = await db.select({ id: acapAssignments.id }).from(acapAssignments);
  if (existingAssignments.length > 0) {
    console.log(`EDUCAP SEED: ${existingAssignments.length} assignments already exist, skipping`);
    return;
  }

  const assessments = await db.select().from(acapAssessments);
  if (assessments.length === 0) {
    console.log("EDUCAP SEED: No assessments found, cannot seed assignments");
    return;
  }

  const allScholars = await db.select({ id: scholars.id, grade: scholars.grade }).from(scholars);
  if (allScholars.length === 0) {
    console.log("EDUCAP SEED: No scholars found, cannot seed assignments");
    return;
  }

  const allTeachers = await db.select({ id: teacherAuth.id }).from(teacherAuth);
  const teacherIdForAssignment = allTeachers.length > 0 ? allTeachers[0].id : "system";

  const scholarIds = allScholars.map(s => s.id);

  for (const assessment of assessments) {
    try {
      await db.insert(acapAssignments).values({
        assessmentId: assessment.id,
        teacherId: teacherIdForAssignment,
        targetType: "scholars",
        targetIds: scholarIds,
        status: "active",
      });
      console.log(`EDUCAP SEED: Created assignment for assessment "${assessment.title}" → ${scholarIds.length} scholars`);
    } catch (err: any) {
      console.error(`EDUCAP SEED: Failed to create assignment for assessment ${assessment.id}:`, err.message);
    }
  }

  console.log("EDUCAP SEED: Assignments seeded");
}
