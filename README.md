# Mentor-Mentee Matching platform for SEET

## Team members
- Marcelina Suszczyk
- Sophie Tabanelli
- Pascal Senn

## Challenge description
SEET provides invaluable mentoring to help refugees enter higher education in Switzerland. Currently, the process of matching a new mentee with the right volunteer mentor is done manually. This is timeconsuming and limits the program's ability to scale. An effective match is critical for success and depends on complex factors like academic goals, field of study, language skills, and personality.

The challenge is to design a system that automates and enhances this matching process. The goal is to create a tool that helps SEET administrators make faster, higher-quality matches between refugee mentees and volunteer mentors, ultimately improving outcomes for the mentees, and making the program more scalable.

## Solution description
The application we created is made up of three pages. In the following, these pages and what happens synchronously in the backend will be explained:

### Upload page
On the first page, the admin is asked to upload two documents. These are the application files (in .csv format) of the mentors and the mentees respectively. These files are then parsed to extract the necessary information.

The information extracted from the mentors application file consists of:
- Mentor ID
- Level of studies
- Birth year
- Gender
- Nationality
- City
- Level of English
- Level of German
- Other languages spoken

The information extracted from the mentees application file consists of:
- Mentee ID
- Birth year
- Desired gender of matched mentor
- Level of English
- Other languages spoken
- Gender
- Level of German
- Nationality
- Level of studies
- City

### Criteria page
On this page, the admin can predefine requirements that must or must not hold for specific mentees. For example, if a certain mentee must not be matched with a specific gender, the admin can add this criterion here.

There are four fields that require filling in by the admin to add a requirement:
1. The first field is a dropdown menu with all Mentee IDs.
2. The second field is a dropdown menu for choosing the criterion. The options of criteria include: Mentor ID, Gender, Nationality, City, Level of studies, German level, English level & Birth year.
3. Thirdly, the admin can choose whether the criterion must or must not equal the subsequent value. For some of the criteria, there is the additional option of choosing "at least" or "at mosts".
4. The last field is again a dropdown menu now consisting of all possible values that are possible for the given criterion and exist in the set of given mentors.

Finally, the admin can add the rule via a button and therefore apply it.

### Matches page
When turning towards this page, the matching-algorithm (see below for more information on the algorithm) is applied. Here we have two columns: On the left side there is one field for every mentor and on the right one field for every mentee. The best matches between these are then visualized with links connecting the mentors and mentees.

To get more information on a certain match, the admin can click on the corresponding link. A pop-up window will appear, showing the overall score of the match and all the individual scores of the criteria. Additionally, the values of both parties are mentioned to make everything more transparent. On the pop-up, the admin can also either reject or approve a the match. When a match is rejected the link vanishes from the graph and all links are redrawn to represent the new gloabal optimum. When a match is applied, the mentee and mentor fields and their link are moved to the top of the page and coloured in green to visualize that they are an approved match. In this case, the other links do not have to be recalculated or redrawn. One can also still reject already approved links and they are again moved down and the new optimum is visualized

### Matching Algorithm
First, some of the possible criterion values are mapped to specific numbers to make comparison between them possible. For example, the language level A2 is mapped to the number 2 while the level B1 correspons to the number 3 and since 2 < 3 holds, A2 < B1 holds as well.

Then, the weights of the criteria are defined. This makes sure that more important criteria such as field of study will be more strongly taken into account.

Next, for each criterion a value on how well the mentor and the mentee match is created an normalized. The normalized values of all the criteria are then multiplied with their belonging weights and added up to get a total distance. This distances basically serves as the overall score of that match.

Finally, the top matches are then chosen to maximize the average total score of matches from the list of all matches and their corresponding score. Contemporarily, the addtional requirements created by the admin on the second page are taken into account so that certain matches either become impossible or are enforced.

## Tech stack
This project was created in collaboration with the AI tool Lovable using:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Notes on file structure for csv input