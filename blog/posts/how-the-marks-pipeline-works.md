Teachers at my father's school kept marks in separate notebooks, one per subject. Entering them into the government portal meant finding each student in every register. This post explains how I automated that.

## The workflow

1. The browser extension reads the school name, class, section, and student roster from the portal.
2. The server builds printed marks sheets, one per subject, with four slots per student.
3. Teachers write marks on the printed sheets. They don't have to change their habits.
4. The completed sheets are photographed and scanned. The server reads the handwriting.
5. Any value with low confidence is highlighted, so the teacher can correct it by hand.
6. The data is converted to JSON, and the extension fills the portal.

## What was hard

1. Implementing the OCR and confidence scoring was the biggest challenge. I had to experiment with different models and thresholds to get reliable results and ensure the system was robust enough for real-world use.
2. Ensuring the system was user-friendly and didn't require teachers to change their habits.
3. Making sure the system was secure and didn't expose any sensitive data was also a challenge.
4. Making the UI intuitive and easy to use since most of the users were not tech-savvy.

Watch the tutorial: [Teachers Marks Entry Extension Guide](https://www.youtube.com/watch?v=vxWaMSW1dyw)