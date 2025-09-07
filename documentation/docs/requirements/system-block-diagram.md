---
sidebar_position: 2
---

# System Block Diagram

The following block diagrams displays the rough architecture of the project, including secondary features such as collaboration, storage, and user style overrides.

## Mermaid Format
```mermaid
flowchart TB
    subgraph frontend[Frontend]
        drawing[Freehand Drawing]
        edit[Make Edit]
        mockup[Mock-up]
        restyle[Edit style on mockup component]
        requestMockup[Request New Mock-up]
    end
    subgraph backend[Backend]
        generateMockup[Generate Mock-up]
        sendEdits[Send Edits to Collaborators]
        sendMockup[Send New Mock-up to Collaborators]
        database[Database]
        processEdit[Process Edit]
        processStyle[Process Style Change]
        fileExport[Export to Image File]
    end
    subgraph agnt[Agent]
        agent["Generate Structural Markdown (XML/HTML)"]
    end
    

    drawing-->edit-->processEdit-->sendEdits-->drawing
    processEdit-->database
    requestMockup-->generateMockup-->fileExport-->agent-->sendMockup-->mockup
    mockup-->restyle-->processStyle-->database
    sendMockup-->database
```

## Manually Drawn
![Manually drawn block diagram](/img/block_diagram.png)
