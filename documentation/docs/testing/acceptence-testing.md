---
sidebar_position: 3
---
# Acceptance Testing

Demonstration of all of the functional and non-functional requirements. This is a combination of automated tests derived from the use-cases (user stories) and manual tests with recorded observation of the results.

[Link to Acceptance Test Spreadsheet](https://docs.google.com/spreadsheets/d/1hZ0SgnbU142vL8mRbzPGSd3U9GB_WxrAtNlkabBRMp4/edit?usp=sharing)


---

## Functional Requirements

| Test ID | Action/Steps | Expected Result | Pass/Fail/Skip | Notes |
|---------|--------------|-----------------|----------------|-------|
| S2S-1 | **Collaborate**<br />‣ Press "Collaborate" | System generates a shareable link. Other users are able to join the workspace and collbaorate | Pass | |
| S2S-2 | **Draw and Collaborate in Real-Time**<br />‣ Select a drawing tool from the toolbar (pen, shapes, text)<br />‣ Draw UI component sketches on the canvas<br />‣ Observe other collaborators drawing simultaneously | Drawing strokes appear on all collaborators' canvases in real-time. System automatically saves the canvas state. Multiple users can draw simultaneously without conflicts. | Pass | |
| S2S-3 | **Duplicate/New Page** <br /> ‣ Press "New" on sidebar or press "Duplicate" to create new page or duplicate the current sketch | <br />**For New Page** <br /> ‣A new page is created <br /> **For Duplicate Page**  <br /> ‣The current sketch is duplicated | Pass | |
| S2S-4 | **Generate Design from Sketch**<br />‣ Complete sketching UI components on canvas<br />‣ Click the "Generate" button | System displays loading indicator and processes sketches. <br /> A modern design is generated using the sketch | Pass | |
| S2S-5 | **Select an element from Generated Design**<br />‣ Select the desired element from the design <br /> | The "Settings" panel will open on the left hand side to allow you to change specific styling based on the type of element selected | Pass | |
| S2S-6 | **Design variations of Selected Element**<br />‣ After selecting element go to the "Variations" tab to see 3 AI generated styling for the element<br />‣ Click on the preferred variation<br />‣Press Cmd+Z/Ctrl+Z to undo" | Selected Design element is updated with the variation selected | Pass | |
| S2S-7 | **Design variations of Selected Element using Prompt**<br />‣ After selecting element go to the "Variations" tab and press "✨" <br />‣ Input prompt for the type of styling you desire <br />‣Enter and select preferred generated styling for element" | Selected Design element is updated with the variation selected | Pass | |
| S2S-8 | **Export Design as Code**<br />‣ Click "Export" to export design in production ready HTML/CSS code| System initiates download of code locally. | Pass | |

---

## Non-Functional Requirements

| Test ID | Action/Steps | Expected Result | Pass/Fail/Skip | Notes |
|---------|--------------|-----------------|----------------|-------|
| S2S-9 | **Cross-Browser Compatibility**<br />‣ Access application from various browsers<br />‣ Perform core actions (create workspace, draw, generate components) | Application functions correctly across all modern browsers with consistent behavior and appearance. | Pass | |
| S2S-10 | **Real-Time Collaboration Performance**<br />‣ Have 4+ users simultaneously drawing in the same workspace<br />‣ Monitor latency and synchronization | Real-time updates maintain low latency. No data loss or merge conflicts occur during simultaneous editing. | Pass | |
| S2S-11 | **AI Generation Performance**<br />‣ Generate components from sketches of varying complexity<br />‣ Measure processing time for small and large sketches | AI processing completes within reasonable timeframe. Loading indicator provides feedback during processing. | Pass | |
| S2S-12 | **Application Performance Under Load**<br />‣ Perform drawing, component generation, and design operations<br />‣ Monitor system responsiveness | Workspace loads within 5 seconds. Application maintains smooth performance during all interactions with no memory leaks or degradation. | Pass | |
| S2S-13 | **Input Device Compatibility**<br />‣ Test drawing functionality using mouse on desktop<br />‣ Test drawing functionality using touch input on tablet/mobile | Both mouse and touch gestures register accurately for drawing and all interface interactions. | Pass | |
| S2S-14 | **Code Quality and Standards**<br />‣ Review all generated code<br />‣ Validate code structure and formatting | Generated code follows framework best practices, is properly formatted, semantic, and accessible. | Pass | |

---

## Error Handling and Edge Cases

| Test ID | Action/Steps | Expected Result | Pass/Fail/Skip | Notes |
|---------|--------------|-----------------|----------------|-------|
| S2S-17 | **AI Generation Error Handling**<br />‣ Attempt to generate components from empty/minimal sketch<br />‣ Simulate AI service failure during generation | System displays helpful error messages: "No UI components detected. Please add more detail to your sketch." or "Generation failed. Please try again." User can retry or modify sketch. | Pass | |
| S2S-18 | **Sketch Cache**<br />‣ Attempt to regenerate sketch after generating without any changes | Sketch Design is not regenerated as no change is made| Pass ||

