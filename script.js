"use strict";

/* =========================================================
   ONSITE QUOTATION
   SECTION 1 OF 7
   GLOBAL DATA + NAVIGATION + ROOMS + DIMENSIONS
   ========================================================= */


/* =========================================================
   PDF LIBRARY
   ========================================================= */

let jsPDFConstructor = null;

if (
    window.jspdf &&
    typeof window.jspdf.jsPDF === "function"
) {
    jsPDFConstructor = window.jspdf.jsPDF;
}


/* =========================================================
   GLOBAL QUOTATION DATA
   ========================================================= */

let quotation = {

    quotationType: "",

    rooms: [],

    copperRate: 3200,

    drainageRate: 0,

    installationRegion: "",
    acType: "",
    installationUnitCost: 0,
    installationUnitCount: 0,
    installationTotal: 0,

    additionalItems: [],

    includePreliminaries: false,

    preliminariesCost: 15000,

    includeAsBuiltDrawing: false,

    asBuiltDrawingCost: 5000,

    acPrices: [],

    clientName: "",

    installationLocation: "",

    salesPerson: "",

    salesPhone: "",

    salesEmail: ""
};


/* =========================================================
   AC CAPACITIES
   ========================================================= */

const AC_CAPACITIES = [

    9000,
    12000,
    18000,
    24000,
    36000,
    48000

];


/* =========================================================
   PAGE NAVIGATION
   ========================================================= */

function showPage(pageNumber) {

    document
        .querySelectorAll(".page")
        .forEach(page => {

            page.classList.remove("active");

        });


    let page =
        document.getElementById(
            "page" + pageNumber
        );

    /* Generated here so existing HTML pages are not renumbered. */
    if (!page && pageNumber === 0) {
        page = document.createElement("section");
        page.id = "page0";
        page.className = "page";
        page.innerHTML = `
            <div class="card quotation-welcome-card">
                <h2>Welcome to Onsite Quotation</h2>
                <p>Please choose the type of quotation you are looking for.</p>
                <div class="quotation-type-options">
                    <button type="button" class="primary-button full-width"
                        onclick="selectQuotationType('supply-only')">Supply Only</button>
                    <button type="button" class="secondary-button full-width"
                        onclick="selectQuotationType('supply-and-commissioning')">Supply and Commissioning</button>
                </div>
            </div>`;
        (document.querySelector("main") || document.body).prepend(page);
    }


    /*
       Page 15 is created dynamically because the original
       HTML has pages 1-14. This keeps the existing HTML
       unchanged while allowing the new installation page
       and quotation-preview order.
    */

    if (!page && pageNumber === 15) {

        page = document.createElement("section");

        page.id = "page15";
        page.className = "page";

        page.innerHTML = `
            <div class="card">

                <h2>
                    Quotation Generated
                </h2>

                <p>
                    Your quotation has been generated successfully.
                </p>

                <button
                    type="button"
                    class="primary-button full-width"
                    onclick="startNewQuotation()"
                >
                    Start New Quotation
                </button>

            </div>
        `;

        document.body.appendChild(page);
    }


    if (!page) {

        console.warn(
            "Page not found:",
            pageNumber
        );

        return;
    }


    page.classList.add("active");


    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });
}

function isSupplyOnly() {
    return quotation.quotationType === "supply-only";
}

function selectQuotationType(type) {
    if (!["supply-only", "supply-and-commissioning"].includes(type)) return;

    quotation.quotationType = type;

    if (isSupplyOnly()) {
        quotation.rooms.forEach(room => {
            room.copper = 0;
            room.drainage = 0;
        });
        quotation.copperRate = 0;
        quotation.drainageRate = 0;
        quotation.installationRegion = "";
        quotation.acType = "";
        quotation.installationUnitCost = 0;
        quotation.installationUnitCount = 0;
        quotation.installationTotal = 0;
        quotation.additionalItems = [];
        quotation.includePreliminaries = false;
        quotation.includeAsBuiltDrawing = false;
    } else {
        quotation.copperRate = quotation.copperRate || 3200;
    }

    showPage(1);
}


/* =========================================================
   FORMATTING
   ========================================================= */

function money(value) {

    const amount =
        Number(value) || 0;


    return (

        "KES " +

        amount.toLocaleString(
            "en-KE",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        )

    );
}


function number(value) {

    const amount =
        Number(value) || 0;


    return amount.toLocaleString(
        "en-KE",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );
}


function escapeHTML(value) {

    return String(value ?? "")

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );
}


/* =========================================================
   STEP 1
   ADD ROOMS
   ========================================================= */

function addRoomInput() {

    const container =
        document.getElementById(
            "roomInputContainer"
        );


    if (!container) return;


    const row =
        document.createElement("div");


    row.className =
        "input-row room-input-row";


    row.innerHTML = `

        <input
            type="text"
            class="room-name-input"
            placeholder="e.g. Bedroom 2"
        >

        <button
            type="button"
            class="remove-input"
            onclick="removeRoomInput(this)"
        >
            ×
        </button>

    `;


    container.appendChild(row);


    row.querySelector("input")?.focus();
}


function removeRoomInput(button) {

    const rows =
        document.querySelectorAll(
            ".room-input-row"
        );


    if (rows.length <= 1) {

        const input =
            button.parentElement
                .querySelector("input");


        if (input) {

            input.value = "";

        }

        return;
    }


    button.parentElement.remove();
}


function saveRooms() {

    const inputs =
        document.querySelectorAll(
            ".room-name-input"
        );


    const names = [];


    inputs.forEach(input => {

        const name =
            input.value.trim();


        if (name) {

            names.push(name);

        }

    });


    if (names.length === 0) {

        alert(
            "Please enter at least one room."
        );

        return;
    }


    quotation.rooms =
        names.map(name => ({

            name,

            length: 0,

            width: 0,

            area: 0,

            copper: 0,

            drainage: 0,

            coolingFactor: 0,

            coolingLoad: 0,

            capacity: 0,

            /*
               Each room can have one or more AC units.
               Individual capacities, types and brands
               will be stored in this array.
            */

            acUnits: []

        }));


    renderRoomPreview();


    showPage(2);
}


/* =========================================================
   STEP 2
   ROOM PREVIEW
   ========================================================= */

function renderRoomPreview() {

    const container =
        document.getElementById(
            "roomPreview"
        );


    if (!container) return;


    if (
        quotation.rooms.length === 0
    ) {

        container.innerHTML = `

            <div class="empty-message">
                No rooms added.
            </div>

        `;

        return;
    }


    container.innerHTML =

        quotation.rooms

            .map(
                (room, index) => `

                    <div class="room-card">

                        <div>

                            <span class="room-name">

                                ${index + 1}.
                                ${escapeHTML(room.name)}

                            </span>

                        </div>


                        <div class="button-group">

                            <button
                                type="button"
                                class="edit-button"
                                onclick="renameRoom(${index})"
                            >
                                Rename
                            </button>


                            <button
                                type="button"
                                class="danger-button"
                                onclick="deleteRoom(${index})"
                            >
                                Delete
                            </button>

                        </div>

                    </div>

                `
            )

            .join("");
}


function renameRoom(index) {

    if (!quotation.rooms[index]) {

        return;

    }


    const currentName =
        quotation.rooms[index].name;


    const newName =
        prompt(
            "Enter the new room name:",
            currentName
        );


    if (
        newName &&
        newName.trim()
    ) {

        quotation.rooms[index].name =
            newName.trim();


        renderRoomPreview();
    }
}


function deleteRoom(index) {

    if (!quotation.rooms[index]) {

        return;

    }


    const roomName =
        quotation.rooms[index].name;


    if (
        !confirm(
            `Delete "${roomName}"?`
        )
    ) {

        return;
    }


    quotation.rooms.splice(
        index,
        1
    );


    if (
        quotation.rooms.length === 0
    ) {

        alert(
            "At least one room is required."
        );


        showPage(1);

        return;
    }


    renderRoomPreview();
}


function goToDimensions() {

    if (
        quotation.rooms.length === 0
    ) {

        alert(
            "Please add at least one room."
        );

        showPage(1);

        return;
    }


    renderDimensionInputs();


    showPage(3);
}


/* =========================================================
   STEP 3
   ROOM DIMENSIONS
   ========================================================= */

function renderDimensionInputs() {

    const container =
        document.getElementById(
            "dimensionInputs"
        );


    if (!container) return;


    container.innerHTML =

        quotation.rooms

            .map(
                (room, index) => `

                    <div class="card">

                        <h3>
                            ${index + 1}.
                            ${escapeHTML(room.name)}
                        </h3>


                        <label>

                            Length (m)

                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                id="length-${index}"
                                value="${room.length || ""}"
                                placeholder="e.g. 5"
                            >

                        </label>


                        <label>

                            Width (m)

                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                id="width-${index}"
                                value="${room.width || ""}"
                                placeholder="e.g. 4"
                            >

                        </label>


                        <div class="info-box">

                            Area:

                            <strong
                                id="area-${index}"
                            >
                                ${number(room.area)}
                                m²
                            </strong>

                        </div>

                    </div>

                `
            )

            .join("");


    quotation.rooms.forEach(
        (room, index) => {

            document
                .getElementById(
                    `length-${index}`
                )
                ?.addEventListener(
                    "input",
                    () =>
                        updateAreaPreview(index)
                );


            document
                .getElementById(
                    `width-${index}`
                )
                ?.addEventListener(
                    "input",
                    () =>
                        updateAreaPreview(index)
                );

        }
    );
}


function updateAreaPreview(index) {

    const length =
        Number(
            document.getElementById(
                `length-${index}`
            )?.value
        );


    const width =
        Number(
            document.getElementById(
                `width-${index}`
            )?.value
        );


    const area =
        length * width;


    const output =
        document.getElementById(
            `area-${index}`
        );


    if (output) {

        output.textContent =
            `${number(area)} m²`;

    }
}


function previewDimensions() {

    let valid = true;


    quotation.rooms.forEach(
        (room, index) => {

            const length =
                Number(
                    document.getElementById(
                        `length-${index}`
                    )?.value
                );


            const width =
                Number(
                    document.getElementById(
                        `width-${index}`
                    )?.value
                );


            if (
                !length ||
                !width ||
                length <= 0 ||
                width <= 0
            ) {

                valid = false;

                return;
            }


            room.length =
                length;

            room.width =
                width;

            room.area =
                length * width;

        }
    );


    if (!valid) {

        alert(
            "Please enter valid length and width for every room."
        );

        return;
    }


    renderDimensionPreview();


    showPage(4);
}


function renderDimensionPreview() {

    const container =
        document.getElementById(
            "dimensionPreview"
        );


    if (!container) return;


    container.innerHTML = `

        <div style="overflow-x:auto">

            <table>

                <thead>

                    <tr>

                        <th>
                            Room
                        </th>

                        <th class="number">
                            Length
                        </th>

                        <th class="number">
                            Width
                        </th>

                        <th class="number">
                            Area
                        </th>

                    </tr>

                </thead>


                <tbody>

                    ${
                        quotation.rooms
                            .map(room => `

                                <tr>

                                    <td>
                                        ${escapeHTML(room.name)}
                                    </td>

                                    <td class="number">
                                        ${number(room.length)}
                                        m
                                    </td>

                                    <td class="number">
                                        ${number(room.width)}
                                        m
                                    </td>

                                    <td class="number">

                                        <strong>
                                            ${number(room.area)}
                                            m²
 </strong>

                                    </td>

                                </tr>

                            `)
                            .join("")
                    }

                </tbody>

            </table>

        </div>

    `;

}

/* =========================================================
   SECTION 2 OF 7
   COPPER + DRAINAGE
   ========================================================= */


/* =========================================================
   STEP 5
   COPPER + DRAINAGE INPUTS
   ========================================================= */

function goToCopper() {

    if (isSupplyOnly()) {
        quotation.rooms.forEach(room => {
            room.copper = 0;
            room.drainage = 0;
        });
        goToCoolingLoad();
        return;
    }

    if (
        !quotation.rooms ||
        quotation.rooms.length === 0
    ) {

        alert(
            "Please add rooms before entering copper and drainage lengths."
        );

        showPage(1);

        return;
    }


    renderCopperInputs();


    showPage(5);
}


function renderCopperInputs() {

    const container =
        document.getElementById(
            "copperInputs"
        );


    if (!container) return;


    container.innerHTML =

        quotation.rooms

            .map(
                (room, index) => `

                    <div class="card">

                        <h3>
                            ${index + 1}.
                            ${escapeHTML(room.name)}
                        </h3>


                        <label>

                            Copper Length (m)

                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                id="copper-${index}"
                                value="${room.copper || ""}"
                                placeholder="e.g. 5"
                            >

                        </label>


                        <label>

                            Drainage Length (m)

                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                id="drainage-${index}"
                                value="${room.drainage || ""}"
                                placeholder="e.g. 6"
                            >

                        </label>

                    </div>

                `
            )

            .join("");
}


/* =========================================================
   SAVE AND PREVIEW COPPER + DRAINAGE
   ========================================================= */

function previewCopper() {

    let valid = true;


    quotation.rooms.forEach(
        (room, index) => {

            const copperInput =
                document.getElementById(
                    `copper-${index}`
                );


            const drainageInput =
                document.getElementById(
                    `drainage-${index}`
                );


            const copper =
                Number(
                    copperInput?.value
                );


            const drainage =
                Number(
                    drainageInput?.value
                );


            if (
                !Number.isFinite(copper) ||
                copper < 0 ||
                !Number.isFinite(drainage) ||
                drainage < 0
            ) {

                valid = false;

                return;
            }


            room.copper =
                copper;


            room.drainage =
                drainage;

        }
    );


    if (!valid) {

        alert(
            "Please enter valid copper and drainage lengths for every room."
        );

        return;
    }


    renderCopperPreview();


    showPage(6);
}


/* =========================================================
   COPPER + DRAINAGE PREVIEW
   ========================================================= */

function renderCopperPreview() {

    const container =
        document.getElementById(
            "copperPreview"
        );


    if (!container) return;


    const totalCopper =
        quotation.rooms.reduce(
            (sum, room) =>
                sum +
                Number(room.copper || 0),
            0
        );


    const totalDrainage =
        quotation.rooms.reduce(
            (sum, room) =>
                sum +
                Number(room.drainage || 0),
            0
        );


    container.innerHTML = `

        <div style="overflow-x:auto">

            <table>

                <thead>

                    <tr>

                        <th>
                            Room
                        </th>

                        <th class="number">
                            Copper
                        </th>

                        <th class="number">
                            Drainage
                        </th>

                    </tr>

                </thead>


                <tbody>

                    ${
                        quotation.rooms
                            .map(room => `

                                <tr>

                                    <td>
                                        ${escapeHTML(room.name)}
                                    </td>

                                    <td class="number">
                                        ${number(room.copper)}
                                        m
                                    </td>

                                    <td class="number">
                                        ${number(room.drainage)}
                                        m
                                    </td>

                                </tr>

                            `)
                            .join("")
                    }


                    <tr>

                        <td>
                            <strong>
                                Total
                            </strong>
                        </td>

                        <td class="number">

                            <strong>
                                ${number(totalCopper)}
                                m
                            </strong>

                        </td>

                        <td class="number">

                            <strong>
                                ${number(totalDrainage)}
                                m
                            </strong>

                        </td>

                    </tr>

                </tbody>

            </table>

        </div>

    `;
}


/* =========================================================
   COMPATIBILITY FUNCTIONS

   These functions support HTML versions that use separate
   copper and drainage buttons.
   ========================================================= */

function goToDrainage() {

    previewCopper();
}


function previewDrainage() {

    previewCopper();
}


/* =========================================================
   STEP 7
   COOLING LOAD FACTORS
   ========================================================= */

function goToCoolingLoad() {

    if (
        !quotation.rooms ||
        quotation.rooms.length === 0
    ) {

        alert(
            "Please add rooms before entering cooling load factors."
        );

        showPage(1);

        return;
    }


    renderCoolingLoadInputs();


    showPage(7);
}


/* =========================================================
   RENDER COOLING LOAD INPUTS
   ========================================================= */

function renderCoolingLoadInputs() {

    const container =
        document.getElementById(
            "coolingLoadInputs"
        );


    if (!container) return;


    container.innerHTML =

        quotation.rooms

            .map(
                (room, index) => `

                    <div class="card">

                        <h3>
                            ${index + 1}.
                            ${escapeHTML(room.name)}
                        </h3>


                        <p>

                            Room Area:

                            <strong>
                                ${number(room.area)}
                                m²
                            </strong>

                        </p>


                        <label>

                            Cooling Load Factor
                            (BTU/hr per m²)

                            <input
                                type="number"
                                min="1"
                                step="1"
                                id="factor-${index}"
                                value="${room.coolingFactor || 700}"
                                placeholder="e.g. 700"
                                oninput="updateCoolingLoadPreview(${index})"
                            >

                        </label>


                        <div class="info-box">

                            Calculated Cooling Load:

                            <strong
                                id="load-${index}"
                            >
                                ${
                                    number(
                                        Number(room.area) *
                                        Number(
                                            room.coolingFactor ||
                                            700
                                        )
                                    )
                                }
                                BTU/hr
                            </strong>

                        </div>

                    </div>

                `
            )

            .join("");
}


/* =========================================================
   LIVE COOLING LOAD PREVIEW
   ========================================================= */

function updateCoolingLoadPreview(index) {

    const room =
        quotation.rooms[index];


    const factorInput =
        document.getElementById(
            `factor-${index}`
        );


    const loadOutput =
        document.getElementById(
            `load-${index}`
        );


    if (
        !room ||
        !factorInput ||
        !loadOutput
    ) {

        return;
    }


    const factor =
        Number(
            factorInput.value
        );


    if (
        !Number.isFinite(factor) ||
        factor <= 0
    ) {

        loadOutput.textContent =
            "0 BTU/hr";

        return;
    }


    const load =
        Number(room.area) *
        factor;


    loadOutput.textContent =
        `${number(load)} BTU/hr`;
}

/* =========================================================
   SECTION 3 OF 7
   AC RECOMMENDATION + AC PRICES
   ========================================================= */


/* =========================================================
   SELECT A SINGLE AC CAPACITY
   ========================================================= */

function selectCapacity(load) {

    for (const capacity of AC_CAPACITIES) {

        if (load <= capacity) {

            return capacity;

        }
    }


    return AC_CAPACITIES[
        AC_CAPACITIES.length - 1
    ];
}


/* =========================================================
   RECOMMEND THE MINIMUM NUMBER OF AC UNITS

   The maximum capacity is selected first.

   Example:
   Required cooling load: 100,000 BTU/hr

   Recommended units:
   48,000 + 48,000 + 9,000 = 105,000 BTU/hr
   ========================================================= */

function recommendACUnits(load) {

    let remaining =
        Math.max(
            0,
            Number(load) || 0
        );


    const maximumCapacity =
        AC_CAPACITIES[
            AC_CAPACITIES.length - 1
        ];


    const units = [];


    while (
        remaining >
        maximumCapacity
    ) {

        units.push({

            capacity:
                maximumCapacity,

            type:
                "HIGHWALL",

            brand:
                "LG"

        });


        remaining -=
            maximumCapacity;
    }


    if (remaining > 0) {

        units.push({

            capacity:
                selectCapacity(
                    remaining
                ),

            type:
                "HIGHWALL",

            brand:
                "LG"

        });

    }


    return units;
}


/* =========================================================
   CALCULATE AC RECOMMENDATIONS
   ========================================================= */

function previewCoolingLoad() {

    if (
        !quotation.rooms ||
        quotation.rooms.length === 0
    ) {

        alert(
            "No rooms found. Please add rooms first."
        );

        showPage(1);

        return;
    }


    let valid = true;


    quotation.rooms.forEach(
        (room, index) => {

            const input =
                document.getElementById(
                    `factor-${index}`
                );


            if (!input) {

                valid = false;

                return;
            }


            const factor =
                Number(
                    input.value
                );


            if (
                !Number.isFinite(factor) ||
                factor <= 0
            ) {

                valid = false;

                return;
            }


            room.coolingFactor =
                factor;


            room.coolingLoad =
                Number(room.area) *
                factor;


            room.acUnits =
                recommendACUnits(
                    room.coolingLoad
                );


            /*
               Keep room.capacity for compatibility with
               any older sections of the application.

               If the room has several AC units, capacity
               stores their total installed capacity.
            */

            room.capacity =
                room.acUnits.reduce(
                    (sum, unit) =>
                        sum +
                        Number(
                            unit.capacity || 0
                        ),
                    0
                );

        }
    );


    if (!valid) {

        alert(
            "Please enter a valid cooling load factor for every room."
        );

        return;
    }


    /*
       Any earlier prices are cleared because recalculating
       recommendations may change the equipment combinations.
    */

    quotation.acPrices = [];


    renderCoolingLoadPreview();


    showPage(8);
}


/* =========================================================
   AC RECOMMENDATION PREVIEW
   ========================================================= */

function renderCoolingLoadPreview() {

    const container =
        document.getElementById(
            "coolingLoadPreview"
        );


    if (!container) return;


    container.innerHTML =

        quotation.rooms

            .map(
                (room, roomIndex) => {

                    const totalSelectedCapacity =

                        (room.acUnits || [])
                            .reduce(
                                (sum, unit) =>
                                    sum +
                                    Number(
                                        unit.capacity || 0
                                    ),
                                0
                            );


                    return `

                        <div class="card">

                            <h3>

                                ${roomIndex + 1}.
                                ${escapeHTML(room.name)}

                            </h3>


                            <p>

                                Room Area:

                                <strong>

                                    ${number(room.area)}
                                    m²

                                </strong>

                            </p>


                            <p>

                                Cooling Load Factor:

                                <strong>

                                    ${number(
                                        room.coolingFactor
                                    )}

                                </strong>

                            </p>


                            <p>

                                Calculated Cooling Load:

                                <strong>

                                    ${number(
                                        room.coolingLoad
                                    )}
                                    BTU/hr

                                </strong>

                            </p>


                            <p>

                                <strong>
                                    Recommended AC Unit(s):</strong>

                            </p>


                            ${
                                (room.acUnits || [])

                                    .map(
                                        (unit, unitIndex) => `

                                            <div
                                                class="ac-recommendation-unit"
                                            >

                                                <h4>

                                                    Unit
                                                    ${unitIndex + 1}

                                                </h4>


                                                <label>

                                                    Capacity
                                                    (BTU/hr)

                                                    <select
                                                        onchange="
                                                            updateRecommendedAC(
                                                                ${roomIndex},
                                                                ${unitIndex},
                                                                'capacity',
                                                                this.value
                                                            )
                                                        "
                                                    >

                                                        ${
                                                            AC_CAPACITIES

                                                                .map(
                                                                    capacity => `

                                                                        <option
                                                                            value="${capacity}"

                                                                            ${
                                                                                Number(
                                                                                    unit.capacity
                                                                                ) ===
                                                                                capacity

                                                                                    ? "selected"
                                                                                    : ""
                                                                            }
                                                                        >

                                                                            ${
                                                                                capacity
                                                                                    .toLocaleString(
                                                                                        "en-KE"
                                                                                    )
                                                                            }

                                                                            BTU/hr

                                                                        </option>

                                                                    `
                                                                )

                                                                .join("")
                                                        }

                                                    </select>

                                                </label>


                                                <label>

                                                    AC Type

                                                    <select
                                                        onchange="
                                                            updateRecommendedAC(
                                                                ${roomIndex},
                                                                ${unitIndex},
                                                                'type',
                                                                this.value
                                                            )
                                                        "
                                                    >

                                                        ${
                                                            [
                                                                "HIGHWALL",
                                                                "CASSETTE",
                                                                "DUCTABLE AC",
                                                                "PORTABLE AC"
                                                            ]

                                                                .map(
                                                                    type => `

                                                                        <option
                                                                            value="${type}"

                                                                            ${
                                                                                unit.type ===
                                                                                type

                                                                                    ? "selected"
                                                                                    : ""
                                                                            }
                                                                        >

                                                                            ${type}

                                                                        </option>

                                                                    `
                                                                )

                                                                .join("")
                                                        }

                                                    </select>

                                                </label>


                                                <label>

                                                    Brand

                                                    <select
                                                        onchange="
                                                            updateRecommendedAC(
                                                                ${roomIndex},
                                                                ${unitIndex},
                                                                'brand',
                                                                this.value
                                                            )
                                                        "
                                                    >

                                                        ${
                                                            [
                                                                "VON",
                                                                "LG",
                                                                "DAIKIN"
                                                            ]

                                                                .map(
                                                                    brand => `

                                                                        <option
                                                                            value="${brand}"

                                                                            ${
                                                                                unit.brand ===
                                                                                brand

                                                                                    ? "selected"
                                                                                    : ""
                                                                            }
                                                                        >

                                                                            ${brand}

                                                                        </option>

                                                                    `
                                                                )

                                                                .join("")
                                                        }

                                                    </select>

                                                </label>

                                            </div>

                                        `
                                    )

                                    .join("")
                            }


                            <div class="info-box">

                                Total Selected Capacity:

                                <strong>

                                    ${
                                        totalSelectedCapacity
                                            .toLocaleString(
                                                "en-KE"
                                            )
                                    }

                                    BTU/hr

                                </strong>

                            </div>

                        </div>

                    `;

                }
            )

            .join("");
}


/* =========================================================
   UPDATE A RECOMMENDED AC
   ========================================================= */

function updateRecommendedAC(
    roomIndex,
    unitIndex,
    field,
    value
) {

    const room =
        quotation.rooms[
            roomIndex
        ];


    const unit =
        room &&
        room.acUnits &&
        room.acUnits[
            unitIndex
        ];


    if (
        !unit ||
        ![
            "capacity",
            "type",
            "brand"
        ].includes(field)
    ) {

        return;
    }


    if (field === "capacity") {

        const capacity =
            Number(value);


        if (
            !AC_CAPACITIES.includes(
                capacity
            )
        ) {

            return;
        }


        unit.capacity =
            capacity;

    } else {

        unit[field] =
            String(value);

    }


    room.capacity =
        room.acUnits.reduce(
            (sum, item) =>
                sum +
                Number(
                    item.capacity || 0
                ),
            0
        );


    /*
       Prices depend on the exact combination of capacity,
       AC type and brand. Clear earlier prices whenever a
       selection changes.
    */

    quotation.acPrices = [];


    /*
       Render the preview again so the total selected
       capacity is updated immediately.
    */

    renderCoolingLoadPreview();
}


/* =========================================================
   PROCEED TO AC PRICES
   ========================================================= */

function goToACPrices() {

    if (
        !quotation.rooms ||
        quotation.rooms.length === 0
    ) {

        alert(
            "No rooms or AC recommendations found."
        );

        return;
    }


    const missingRecommendation =

        quotation.rooms.some(
            room =>

                !Array.isArray(
                    room.acUnits
                ) ||

                room.acUnits.length === 0
        );


    if (missingRecommendation) {

        alert(
            "AC recommendations have not been calculated."
        );

        showPage(7);

        return;
    }


    renderACPriceInputs();


    showPage(9);
}


/* =========================================================
   GET AC EQUIPMENT COMBINATIONS

   AC units are grouped only when they have the same:
   1. Capacity
   2. AC type
   3. Brand

   The rooms served by every combination are retained.
   ========================================================= */

function getACCombinations() {

    const combinations =
        new Map();


    quotation.rooms.forEach(
        room => {

            (room.acUnits || [])
                .forEach(unit => {

                    const capacity =
                        Number(
                            unit.capacity
                        ) || 0;


                    const type =
                        unit.type ||
                        "HIGHWALL";


                    const brand =
                        unit.brand ||
                        "LG";


                    const key =
                        `${capacity}|${type}|${brand}`;


                    if (
                        !combinations.has(key)
                    ) {

                        combinations.set(
                            key,
                            {

                                key,

                                capacity,

                                type,

                                brand,

                                rooms: [],

                                quantity: 0

                            }
                        );

                    }


                    const item =
                        combinations.get(key);


                    item.quantity += 1;


                    if (
                        !item.rooms.includes(
                            room.name
                        )
                    ) {

                        item.rooms.push(
                            room.name
                        );

                    }

                });

        }
    );


    return [

        ...combinations.values()

    ].sort(
        (a, b) =>

            b.capacity -
            a.capacity ||

            a.type.localeCompare(
                b.type
            ) ||

            a.brand.localeCompare(
                b.brand
            )
    );
}


/* =========================================================
   RENDER AC PRICE INPUTS
   ========================================================= */

function renderACPriceInputs() {

    const container =
        document.getElementById(
            "acPriceInputs"
        );


    if (!container) return;


    const combinations =
        getACCombinations();


    if (
        combinations.length === 0
    ) {

        container.innerHTML = `

            <div class="empty-message">

                No AC equipment combinations were found.

            </div>

        `;

        return;
    }


    container.innerHTML =

        combinations

            .map(item => {

                const existing =

                    quotation.acPrices.find(
                        priceItem =>
                            priceItem.key ===
                            item.key
                    );


                return `

                    <div class="card">

                        <h3>

                            ${escapeHTML(item.brand)}

                            ${Number(
                                item.capacity
                            ).toLocaleString(
                                "en-KE"
                            )}

                            BTU/hr

                            ${escapeHTML(item.type)}

                        </h3>


                        <p>

                            Room(s):

                            <strong>

                                ${
                                    item.rooms
                                        .map(
                                            escapeHTML
                                        )
                                        .join(", ")
                                }

                            </strong>

                        </p>


                        <p>

                            Quantity:

                            <strong>

                                ${item.quantity}

                            </strong>

                        </p>


                        <label>

                            Unit Price (KES)

                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                class="ac-price-input"
                                data-key="${escapeHTML(item.key)}"

                                value="${
                                    existing
                                        ? existing.unitPrice
                                        : ""
                                }"

                                placeholder="Enter unit price"
                            >

                        </label>

                    </div>

                `;

            })

            .join("");
}


/* =========================================================
   SAVE AC PRICES
   ========================================================= */

function saveACPrices() {

    const inputs =
        document.querySelectorAll(
            ".ac-price-input"
        );


    let valid = true;


    const prices = [];


    const combinations =
        getACCombinations();


    inputs.forEach(input => {

        const key =
            input.dataset.key;


        const unitPrice =
            Number(
                input.value
            );


        if (
            !Number.isFinite(unitPrice) ||
            unitPrice <= 0
        ) {

            valid = false;

            return;
        }


        const combination =

            combinations.find(
                item =>
                    item.key === key
            );


        if (!combination) {

            valid = false;

            return;
        }


        prices.push({

            ...combination,

            unitPrice,

            total:

                combination.quantity *
                unitPrice

        });

    });


    if (
        !valid ||
        prices.length !==
        combinations.length
    ) {

        alert(
            "Please enter a valid price for every AC combination."
        );

        return;
    }


    quotation.acPrices =
        prices;

    if (isSupplyOnly()) {
        showPage(13);
    } else {
        goToMaterialRates();
    }
}


/* =========================================================
   INSTALLATION COMMISSIONING RATES
   ========================================================= */

const INSTALLATION_RATES = {

    "Mombasa Region": {

        "HIGHWALL": 6500,

        "CASSETTE": 8500,

        "DUCTABLE": 10500,

        "FLOOR STANDING": 10500

    },


    "Kilifi County Up to Kilifi Town": {

        "HIGHWALL": 10500,

        "CASSETTE": 10500,

        "DUCTABLE": 13000,

        "FLOOR STANDING": 12500

    },


    "Kilifi County After Kilifi Town": {

        "HIGHWALL": 12500,

        "CASSETTE": 12500,

        "DUCTABLE": 14000,

        "FLOOR STANDING": 13500

    },


    "Kwale County Up to Ukunda": {

        "HIGHWALL": 10500,

        "CASSETTE": 10500,

        "DUCTABLE": 13000,

        "FLOOR STANDING": 12500

    },


    "Kwale County After Ukunda": {

        "HIGHWALL": 12500,

        "CASSETTE": 12500,

        "DUCTABLE": 14000,

        "FLOOR STANDING": 13500

    },


    "Taita Taveta County": {

        "HIGHWALL": 14500,

        "CASSETTE": 14500,

        "DUCTABLE": 18000,

        "FLOOR STANDING": 17500

    },


    "Tana River County": {

        "HIGHWALL": 14500,

        "CASSETTE": 14500,

        "DUCTABLE": 19000,

        "FLOOR STANDING": 18500

    },


    "Lamu County": {

        "HIGHWALL": 17000,

        "CASSETTE": 17000,

        "DUCTABLE": 21000,

        "FLOOR STANDING": 20500

    }

};


/* =========================================================
   GET TOTAL NUMBER OF AC UNITS
   ========================================================= */

function getTotalACUnits() {

    return quotation.rooms.reduce(
        (sum, room) =>

            sum +

            (
                Array.isArray(
                    room.acUnits
                )

                    ? room.acUnits.length
                    : 0
            ),
        0
    );
}


/* =========================================================
   GET INSTALLATION UNIT COST
   ========================================================= */

function getInstallationUnitCost() {

    const region =
        quotation.installationRegion;


    const type =
        quotation.acType;


    return (

        INSTALLATION_RATES[
            region
        ]?.[
            type
        ] || 0

    );
}


/* =========================================================
   GET INSTALLATION TOTAL
   ========================================================= */

function getInstallationTotal() {

    return (

        Number(
            quotation.installationUnitCount ||
            0
        ) *

        Number(
            quotation.installationUnitCost ||
            0
        )

    );
}


/* =========================================================
   RENDER INSTALLATION COST PAGE
   ========================================================= */

function renderInstallationCostPage() {

    /*
       Page 11 originally contained the additional-items
       interface. Its contents are replaced by the
       installation commissioning interface.
    */

    const page =
        document.getElementById(
            "page11"
        );


    if (!page) return;


    page.innerHTML = `

        <div class="card">

            <h2>
                Installation Commissioning Cost
            </h2>


            <p class="info-box">

                Select the installation region and AC type.

                The installation cost per unit will be selected
                automatically from the approved rate table.

            </p>


            <label>

                Installation Region

                <select id="installationRegion">

                    <option value="">
                        Select installation region
                    </option>

                    ${
                        Object.keys(
                            INSTALLATION_RATES
                        )

                            .map(region => `

                                <option
                                    value="${escapeHTML(region)}"

                                    ${
                                        quotation.installationRegion ===
                                        region

                                            ? "selected"
                                            : ""
                                    }
                                >

                                    ${escapeHTML(region)}

                                </option>

                            `)

                            .join("")
                    }

                </select>

            </label>


            <label>

                Installation AC Type

                <select id="acType">

                    <option value="">
                        Select installation AC type
                    </option>


                    <option
                        value="HIGHWALL"

                        ${
                            quotation.acType ===
                            "HIGHWALL"

                                ? "selected"
                                : ""
                        }
                    >
                        HIGHWALL
                    </option>


                    <option
                        value="CASSETTE"

                        ${
                            quotation.acType ===
                            "CASSETTE"

                                ? "selected"
                                : ""
                        }
                    >
                        CASSETTE
                    </option>


                    <option
                        value="DUCTABLE"

                        ${
                            quotation.acType ===
                            "DUCTABLE"

                                ? "selected"
                                : ""
                        }
                    >
                        DUCTABLE
                    </option>


                    <option
                        value="FLOOR STANDING"

                        ${
                            quotation.acType ===
                            "FLOOR STANDING"

                                ? "selected"
                                : ""
                        }
                    >
                        FLOOR STANDING
                    </option>

                </select>

            </label>


            <div class="info-box">

                <strong>
                    Number of AC Units
                </strong>

                <br>

                <span
                    id="installationUnitCountDisplay"
                >
                    ${getTotalACUnits()}
                </span>

                units

            </div>


            <div class="info-box">

                <strong>
                    Installation Cost Per Unit
                </strong>

                <br>

                <span
                    id="installationUnitCostDisplay"
                >

                    ${money(
                        quotation.installationUnitCost
                    )}

                </span>

            </div>


            <div class="info-box">

                <strong>
                    Total Installation Cost
                </strong>

                <br>

                <span
                    id="installationTotalDisplay"
                >

                    ${money(
                        quotation.installationTotal
                    )}

                </span>

            </div>


            <button
                type="button"
                class="secondary-button full-width"
                onclick="saveInstallationCosts()"
            >
                Continue to Accessories →
            </button>

        </div>

    `;


    const regionSelect =
        document.getElementById(
            "installationRegion"
        );


    const typeSelect =
        document.getElementById(
            "acType"
        );


    function updateInstallationPreview() {

        const region =
            regionSelect?.value ||
            "";


        const type =
            typeSelect?.value ||
            "";


        const unitCount =
            getTotalACUnits();


        const unitCost =

            INSTALLATION_RATES[
                region
            ]?.[
                type
            ] || 0;


        const total =
            unitCount *
            unitCost;


        quotation.installationRegion =
            region;


        quotation.acType =
            type;


        quotation.installationUnitCount =
            unitCount;


        quotation.installationUnitCost =
            unitCost;


        quotation.installationTotal =
            total;


        const countOutput =
            document.getElementById(
                "installationUnitCountDisplay"
            );


        const costOutput =
            document.getElementById(
                "installationUnitCostDisplay"
            );


        const totalOutput =
            document.getElementById(
                "installationTotalDisplay"
            );


        if (countOutput) {

            countOutput.textContent =
                unitCount;

        }


        if (costOutput) {

            costOutput.textContent =
                money(unitCost);

        }


        if (totalOutput) {

            totalOutput.textContent =
                money(total);

        }
    }


    regionSelect?.addEventListener(
        "change",
        updateInstallationPreview
    );


    typeSelect?.addEventListener(
        "change",
        updateInstallationPreview
    );


    updateInstallationPreview();
}


/* =========================================================
   GO TO INSTALLATION COST PAGE
   ========================================================= */

function goToInstallationCosts() {

    quotation.installationUnitCount =
        getTotalACUnits();


    renderInstallationCostPage();


    showPage(11);
}


/* =========================================================
   SAVE INSTALLATION COSTS
   ========================================================= */

function saveInstallationCosts() {

    const region =
        document.getElementById(
            "installationRegion"
        )?.value || "";


    const type =
        document.getElementById(
            "acType"
        )?.value || "";


    if (!region) {

        alert(
            "Please select the installation region."
        );

        return;
    }


    if (!type) {

        alert(
            "Please select the installation AC type."
        );

        return;
    }


    const unitCount =
        getTotalACUnits();


    const unitCost =

        INSTALLATION_RATES[
            region
        ]?.[
            type
        ] || 0;


    if (
        unitCount <= 0 ||
        unitCost <= 0
    ) {

        alert(
            "Unable to calculate the installation cost. Please check the AC quantities and selections."
        );

        return;
    }


    quotation.installationRegion =
        region;


    quotation.acType =
        type;


    quotation.installationUnitCount =
        unitCount;


    quotation.installationUnitCost =
        unitCost;


    quotation.installationTotal =
        unitCount *
        unitCost;


    renderAdditionalItems();


    showPage(12);
}


/* =========================================================
   MATERIAL RATES
   ========================================================= */

function goToMaterialRates() {

    const copperInput =
        document.getElementById(
            "copperRate"
        );


    const drainageInput =
        document.getElementById(
            "drainageRate"
        );


    if (copperInput) {

        copperInput.value =
            quotation.copperRate || "";

    }


    if (drainageInput) {

        drainageInput.value =
            quotation.drainageRate || "";

    }


    showPage(10);
}


/* =========================================================
   SAVE MATERIAL RATES
   ========================================================= */

function saveMaterialRates() {

    const copperRate =
        Number(
            document.getElementById(
                "copperRate"
            )?.value
        );


    const drainageRate =
        Number(
            document.getElementById(
                "drainageRate"
            )?.value
        );


    if (
        !Number.isFinite(copperRate) ||
        copperRate < 0
    ) {

        alert(
            "Please enter a valid copper rate."
        );

        return;
    }


    if (
        !Number.isFinite(drainageRate) ||
        drainageRate < 0
    ) {

        alert(
            "Please enter a valid drainage rate."
        );

        return;
    }


    quotation.copperRate =
        copperRate;


    quotation.drainageRate =
        drainageRate;


    goToInstallationCosts();
}

/* =========================================================
   SECTION 4 OF 7
   INSTALLATION ACCESSORIES + ADDITIONAL ITEMS
   PRELIMINARIES + AS-BUILT DRAWING
   ========================================================= */


/* =========================================================
   STEP 12
   INSTALLATION COMMISSIONING & ACCESSORIES
   ========================================================= */

function renderAdditionalItems() {

    const container =
        document.getElementById(
            "additionalItems"
        );


    if (!container) return;


    container.innerHTML = `

        <!-- ===============================================
             INSTALLATION COMMISSIONING
        ================================================ -->

        <div class="card">

            <h3>
                Installation Commissioning
            </h3>


            <p>

                Installation Region:

                <strong>

                    ${
                        escapeHTML(
                            quotation.installationRegion ||
                            "Not selected"
                        )
                    }

                </strong>

            </p>


            <p>

                Installation AC Type:

                <strong>

                    ${
                        escapeHTML(
                            quotation.acType ||
                            "Not selected"
                        )
                    }

                </strong>

            </p>


            <p>

                Number of AC Units:

                <strong>

                    ${
                        Number(
                            quotation.installationUnitCount
                        ) || 0
                    }

                </strong>

            </p>


            <p>

                Installation Cost Per Unit:

                <strong>

                    ${
                        money(
                            quotation.installationUnitCost
                        )
                    }

                </strong>

            </p>


            <div class="info-box">

                Total Installation Cost:

                <strong>

                    ${
                        money(
                            getInstallationCommissioningTotal()
                        )
                    }

                </strong>

            </div>

        </div>


        <!-- ===============================================
             ADDITIONAL ITEM ENTRY
        ================================================ -->

        <div class="card">

            <h3>
                Accessories / Additional Item
            </h3>


            <label>

                Item Name

                <input
                    id="extraItemName"
                    type="text"
                    placeholder="e.g. Wall bracket"
                >

            </label>


            <label>

                Quantity

                <input
                    id="extraItemQty"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 2"
                >

            </label>


            <label>

                Unit

                <input
                    id="extraItemUnit"
                    type="text"
                    placeholder="e.g. pcs"
                >

            </label>


            <label>

                Unit Price (KES)

                <input
                    id="extraItemPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 1500"
                >

            </label>


            <div class="info-box">

                Item Total:

                <strong id="extraItemTotal">
                    KES 0.00
                </strong>

            </div>


            <button
                type="button"
                class="secondary-button full-width"
                onclick="saveExtraItem()"
            >
                Add Item
            </button>

        </div>


        <!-- ===============================================
             SAVED ADDITIONAL ITEMS
        ================================================ -->

        <div id="additionalItemsPreview"></div>


        <!-- ===============================================
             PRELIMINARIES
        ================================================ -->

        <div class="card">

            <h3>
                Preliminaries
            </h3>


            <label>

                <input
                    type="checkbox"
                    id="includePreliminaries"

                    ${
                        quotation.includePreliminaries
                            ? "checked"
                            : ""
                    }
                >

                Include Preliminaries

            </label>


            <div
                id="preliminariesCostContainer"

                style="
                    display:${
                        quotation.includePreliminaries
                            ? "block"
                            : "none"
                    };
                "
            >

                <label>

                    Preliminaries Cost (KES)

                    <input
                        type="number"
                        id="preliminariesCost"
                        min="0"
                        step="0.01"

                        value="${
                            quotation.preliminariesCost
                        }"
                    >

                </label>

            </div>

        </div>


        <!-- ===============================================
             AS-BUILT DRAWING
        ================================================ -->

        <div class="card">

            <h3>
                As-Built Drawing
            </h3>


            <label>

                <input
                    type="checkbox"
                    id="includeAsBuiltDrawing"

                    ${
                        quotation.includeAsBuiltDrawing
                            ? "checked"
                            : ""
                    }
                >

                Include As-Built Drawing

            </label>


            <div
                id="asBuiltDrawingCostContainer"

                style="
                    display:${
                        quotation.includeAsBuiltDrawing
                            ? "block"
                            : "none"
                    };
                "
            >

                <label>

                    As-Built Drawing Cost (KES)

                    <input
                        type="number"
                        id="asBuiltDrawingCost"
                        min="0"
                        step="0.01"

                        value="${
                            quotation.asBuiltDrawingCost
                        }"
                    >

                </label>

            </div>

        </div>


        <!-- ===============================================
             CONTINUE TO CLIENT DETAILS
        ================================================ -->

        <button
            type="button"
            class="primary-button full-width"
            onclick="finishAdditionalItems()"
        >
            Continue to Client Details →
        </button>

    `;


    /* =====================================================
       ADDITIONAL ITEM LIVE CALCULATION
       ===================================================== */

    document
        .getElementById(
            "extraItemQty"
        )
        ?.addEventListener(
            "input",
            calculateExtraItem
        );


    document
        .getElementById(
            "extraItemPrice"
        )
        ?.addEventListener(
            "input",
            calculateExtraItem
        );


    /* =====================================================
       PRELIMINARIES CHECKBOX
       ===================================================== */

    document
        .getElementById(
            "includePreliminaries"
        )
        ?.addEventListener(
            "change",
            function () {

                quotation.includePreliminaries =
                    this.checked;


                const container =
                    document.getElementById(
                        "preliminariesCostContainer"
                    );


                if (container) {

                    container.style.display =
                        this.checked
                            ? "block"
                            : "none";

                }

            }
        );


    document
        .getElementById(
            "preliminariesCost"
        )
        ?.addEventListener(
            "input",
            function () {

                quotation.preliminariesCost =
                    Number(
                        this.value
                    ) || 0;

            }
        );


    /* =====================================================
       AS-BUILT DRAWING CHECKBOX
       ===================================================== */

    document
        .getElementById(
            "includeAsBuiltDrawing"
        )
        ?.addEventListener(
            "change",
            function () {

                quotation.includeAsBuiltDrawing =
                    this.checked;


                const container =
                    document.getElementById(
                        "asBuiltDrawingCostContainer"
                    );


                if (container) {

                    container.style.display =
                        this.checked
                            ? "block"
                            : "none";

                }

            }
        );


    document
        .getElementById(
            "asBuiltDrawingCost"
        )
        ?.addEventListener(
            "input",
            function () {

                quotation.asBuiltDrawingCost =
                    Number(
                        this.value
                    ) || 0;

            }
        );


    renderAdditionalItemsPreview();
}


/* =========================================================
   CALCULATE ADDITIONAL ITEM TOTAL
   ========================================================= */

function calculateExtraItem() {

    const quantity =
        Number(
            document.getElementById(
                "extraItemQty"
            )?.value
        );


    const unitPrice =
        Number(
            document.getElementById(
                "extraItemPrice"
            )?.value
        );


    const total =
        quantity *
        unitPrice;


    const output =
        document.getElementById(
            "extraItemTotal"
        );


    if (output) {

        output.textContent =
            money(total);

    }
}


/* =========================================================
   SAVE ADDITIONAL ITEM
   ========================================================= */

function saveExtraItem() {

    const name =
        document.getElementById(
            "extraItemName"
        )?.value.trim();


    const quantity =
        Number(
            document.getElementById(
                "extraItemQty"
            )?.value
        );


    const unit =
        document.getElementById(
            "extraItemUnit"
        )?.value.trim() ||
        "lot";


    const unitPrice =
        Number(
            document.getElementById(
                "extraItemPrice"
            )?.value
        );


    if (
        !name ||
        !Number.isFinite(quantity) ||
        quantity <= 0 ||
        !Number.isFinite(unitPrice) ||
        unitPrice < 0
    ) {

        alert(
            "Please enter the item name, quantity and a valid unit price."
        );

        return;
    }


    quotation.additionalItems.push({

        name,

        quantity,

        unit,

        unitPrice,

        total:
            quantity *
            unitPrice

    });


    const nameInput =
        document.getElementById(
            "extraItemName"
        );


    const quantityInput =
        document.getElementById(
            "extraItemQty"
        );


    const unitInput =
        document.getElementById(
            "extraItemUnit"
        );


    const priceInput =
        document.getElementById(
            "extraItemPrice"
        );


    const totalOutput =
        document.getElementById(
            "extraItemTotal"
        );


    if (nameInput) {

        nameInput.value = "";

    }


    if (quantityInput) {

        quantityInput.value = "";

    }


    if (unitInput) {

        unitInput.value = "";

    }


    if (priceInput) {

        priceInput.value = "";

    }


    if (totalOutput) {

        totalOutput.textContent =
            "KES 0.00";

    }


    renderAdditionalItemsPreview();
}


/* =========================================================
   ADDITIONAL ITEMS PREVIEW
   ========================================================= */

function renderAdditionalItemsPreview() {

    const container =
        document.getElementById(
            "additionalItemsPreview"
        );


    if (!container) return;


    const additionalCards =

        quotation.additionalItems.length === 0

            ? `

                <div class="empty-message">

                    No other accessories or additional items added.

                </div>

            `

            : quotation.additionalItems

                .map(
                    (item, index) => `

                        <div class="card">

                            <strong>

                                ${index + 1}.
                                ${escapeHTML(item.name)}

                            </strong>


                            <p>

                                ${number(item.quantity)}

                                ${escapeHTML(item.unit)}

                                ×

                                ${money(item.unitPrice)}

                            </p>


                            <p>

                                Total:

                                <strong>

                                    ${money(item.total)}

                                </strong>

                            </p>


                            <button
                                type="button"
                                class="danger-button"
                                onclick="deleteAdditionalItem(${index})"
                            >
                                Delete
                            </button>

                        </div>

                    `
                )

                .join("");


    container.innerHTML =
        additionalCards;
}


/* =========================================================
   DELETE ADDITIONAL ITEM
   ========================================================= */

function deleteAdditionalItem(index) {

    if (
        !quotation.additionalItems[index]
    ) {

        return;
    }


    if (
        !confirm(
            "Delete this additional item?"
        )
    ) {

        return;
    }


    quotation.additionalItems.splice(
        index,
        1
    );


    renderAdditionalItemsPreview();
}


/* =========================================================
   FINISH ADDITIONAL ITEMS
   ========================================================= */

function finishAdditionalItems() {

    const preliminariesCheckbox =
        document.getElementById(
            "includePreliminaries"
        );


    const preliminariesCostInput =
        document.getElementById(
            "preliminariesCost"
        );


    quotation.includePreliminaries =
        Boolean(
            preliminariesCheckbox?.checked
        );


    quotation.preliminariesCost =
        Number(
            preliminariesCostInput?.value
        ) || 0;


    const asBuiltCheckbox =
        document.getElementById(
            "includeAsBuiltDrawing"
        );


    const asBuiltCostInput =
        document.getElementById(
            "asBuiltDrawingCost"
        );


    quotation.includeAsBuiltDrawing =
        Boolean(
            asBuiltCheckbox?.checked
        );


    quotation.asBuiltDrawingCost =
        Number(
            asBuiltCostInput?.value
        ) || 0;


    if (
        quotation.includePreliminaries &&
        quotation.preliminariesCost < 0
    ) {

        alert(
            "Please enter a valid preliminaries cost."
        );

        return;
    }


    if (
        quotation.includeAsBuiltDrawing &&
        quotation.asBuiltDrawingCost < 0
    ) {

        alert(
            "Please enter a valid as-built drawing cost."
        );

        return;
    }


    /*
       Client details must be completed before the final
       quotation preview is rendered.
    */

    showPage(13);
}

/* =========================================================
   SECTION 5 OF 7
   TOTALS + CLIENT DETAILS + FINAL QUOTATION PREVIEW
   ========================================================= */


/* =========================================================
   EQUIPMENT TOTAL
   ========================================================= */

function getEquipmentTotal() {

    return quotation.acPrices.reduce(

        (sum, item) =>

            sum +
            Number(
                item.total || 0
            ),

        0

    );
}


/* =========================================================
   COPPER TOTAL
   ========================================================= */

function getCopperTotal() {

    if (isSupplyOnly()) return 0;

    return (

        getTotalCopperLength() *

        Number(
            quotation.copperRate || 0
        )

    );
}


/* =========================================================
   DRAINAGE TOTAL
   ========================================================= */

function getDrainageTotal() {

    if (isSupplyOnly()) return 0;

    return (

        getTotalDrainageLength() *

        Number(
            quotation.drainageRate || 0
        )

    );
}


/* =========================================================
   INSTALLATION COMMISSIONING TOTAL
   ========================================================= */

function getInstallationCommissioningTotal() {

    if (isSupplyOnly()) return 0;

    return Number(
        quotation.installationTotal || 0
    );
}


/* =========================================================
   ADDITIONAL ITEMS TOTAL
   ========================================================= */

function getAdditionalItemsTotal() {

    if (isSupplyOnly()) return 0;

    return quotation.additionalItems.reduce(

        (sum, item) =>

            sum +
            Number(
                item.total || 0
            ),

        0

    );
}


/* =========================================================

   PRELIMINARIES TOTAL
   ========================================================= */

function getPreliminariesTotal() {

    if (isSupplyOnly()) return 0;

    if (
        !quotation.includePreliminaries
    ) {

        return 0;

    }


    return Number(
        quotation.preliminariesCost || 0
    );
}


/* =========================================================
   AS-BUILT DRAWING TOTAL
   ========================================================= */

function getAsBuiltDrawingTotal() {

    if (isSupplyOnly()) return 0;

    if (
        !quotation.includeAsBuiltDrawing
    ) {

        return 0;

    }


    return Number(
        quotation.asBuiltDrawingCost || 0
    );
}


/* =========================================================
   TOTAL HVAC WORKS
   ========================================================= */

function getHVACTotal() {

    return (

        getEquipmentTotal() +

        getCopperTotal() +

        getDrainageTotal() +

        getInstallationCommissioningTotal() +

        getAdditionalItemsTotal()

    );
}


/* =========================================================
   QUOTATION SUBTOTAL
   ========================================================= */

function getQuotationSubtotal() {

    return (

        getHVACTotal() +

        getPreliminariesTotal() +

        getAsBuiltDrawingTotal()

    );
}


/* =========================================================
   VAT
   ========================================================= */

function getQuotationVAT() {

    return (

        getQuotationSubtotal() *
        0.16

    );
}


/* =========================================================
   GRAND TOTAL
   ========================================================= */

function getQuotationGrandTotal() {

    return (

        getQuotationSubtotal() +

        getQuotationVAT()

    );
}


/* =========================================================
   GET CLIENT DETAILS
   ========================================================= */

function getClientDetails() {

    quotation.clientName =
        document.getElementById(
            "clientName"
        )?.value.trim() || "";


    quotation.installationLocation =
        document.getElementById(
            "installationLocation"
        )?.value.trim() || "";


    quotation.salesPerson =
        document.getElementById(
            "salesPerson"
        )?.value.trim() || "";


    quotation.salesPhone =
        document.getElementById(
            "salesPhone"
        )?.value.trim() || "";


    quotation.salesEmail =
        document.getElementById(
            "salesEmail"
        )?.value.trim() || "";
}


/* =========================================================
   CLIENT DETAILS → QUOTATION PREVIEW
   ========================================================= */

function proceedToQuotationPreview() {

    getClientDetails();


    if (!quotation.clientName) {

        alert(
            "Please enter the client name."
        );

        return;
    }


    if (!quotation.installationLocation) {

        alert(
            "Please enter the installation location."
        );

        return;
    }


    renderQuotationPreview();


    showPage(14);
}


/* =========================================================
   FINAL QUOTATION PREVIEW
   ========================================================= */

function renderQuotationPreview() {

    const container =
        document.getElementById(
            "quotationPreview"
        );


    if (!container) return;


    const equipment =
        getEquipmentTotal();


    const copper =
        getCopperTotal();


    const drainage =
        getDrainageTotal();


    const installation =
        getInstallationCommissioningTotal();


    const preliminaries =
        getPreliminariesTotal();


    const asBuilt =
        getAsBuiltDrawingTotal();


    const subtotal =
        getQuotationSubtotal();


    const vat =
        getQuotationVAT();


    const grandTotal =
        getQuotationGrandTotal();


    container.innerHTML = `

        <!-- =================================================
             FINAL QUOTATION DOCUMENT
        ================================================== -->

        <div
            class="quotation-document"
            id="finalQuotationDocument"
        >

            <h1>
                QUOTATION
            </h1>


            <!-- =============================================
                 CLIENT DETAILS
            ============================================== -->

            <div class="quotation-section">

                <h3>
                    CLIENT DETAILS
                </h3>


                <table class="client-table">

                    <tbody>

                        <tr>

                            <td>
                                CLIENT
                            </td>

                            <td>

                                ${
                                    escapeHTML(
                                        quotation.clientName
                                    )
                                }

                            </td>

                        </tr>


                        <tr>

                            <td>
                                LOCATION
                            </td>

                            <td>

                                ${
                                    escapeHTML(
                                        quotation.installationLocation
                                    )
                                }

                            </td>

                        </tr>


                        <tr>

                            <td>
                                SALES PERSON
                            </td>

                            <td>

                                ${
                                    escapeHTML(
                                        quotation.salesPerson
                                    )
                                }

                            </td>

                        </tr>


                        <tr>

                            <td>
                                PHONE
                            </td>

                            <td>

                                ${
                                    escapeHTML(
                                        quotation.salesPhone
                                    )
                                }

                            </td>

                        </tr>


                        <tr>

                            <td>
                                EMAIL
                            </td>

                            <td>

                                ${
                                    escapeHTML(
                                        quotation.salesEmail
                                    )
                                }

                            </td>

                        </tr>

                    </tbody>

                </table>

            </div>


            <!-- =============================================
                 EQUIPMENT
            ============================================== -->

            <div class="quotation-section">

                <h3>
                    1. EQUIPMENT
                </h3>


                <div style="overflow-x:auto">

                    <table>

                        <thead>

                            <tr>

                                <th>
                                    Brand / Capacity / Type / Room(s)
                                </th>

                                <th class="number">
                                    Qty
                                </th>

                                <th class="number">
                                    Unit Price
                                </th>

                                <th class="number">
                                    Total
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            ${
                                quotation.acPrices

                                    .map(item => `

                                        <tr>

                                            <td>

                                                <strong>

                                                    ${
                                                        escapeHTML(
                                                            item.brand ||
                                                            "LG"
                                                        )
                                                    }

                                                    ${Number(
                                                        item.capacity
                                                    ).toLocaleString(
                                                        "en-KE"
                                                    )}

                                                    BTU/hr

                                                </strong>

                                                <br>

                                                ${
                                                    escapeHTML(
                                                        item.type ||
                                                        "HIGHWALL"
                                                    )
                                                }

                                                <br>

                                                <small>

                                                    Room(s):

                                                    ${
                                                        Array.isArray(
                                                            item.rooms
                                                        )

                                                            ? item.rooms
                                                                .map(
                                                                    escapeHTML
                                                                )
                                                                .join(", ")

                                                            : ""
                                                    }

                                                </small>

                                            </td>


                                            <td class="number">

                                                ${item.quantity}

                                            </td>


                                            <td class="number">

                                                ${
                                                    money(
                                                        item.unitPrice
                                                    )
                                                }

                                            </td>


                                            <td class="number">

                                                ${
                                                    money(
                                                        item.total
                                                    )
                                                }

                                            </td>

                                        </tr>

                                    `)

                                    .join("")
                            }


                            <tr>

                                <td colspan="3">

                                    <strong>
                                        Equipment Total
                                    </strong>

                                </td>


                                <td class="number">

                                    <strong>

                                        ${money(equipment)}

                                    </strong>

                                </td>

                            </tr>

                        </tbody>

                    </table>

                </div>

            </div>


            <!-- =============================================
                 COPPER AND ACCESSORIES
            ============================================== -->

            <div class="quotation-section">

                <h3>
                    2. COPPER AND ACCESSORIES
                </h3>


                <div style="overflow-x:auto">

                    <table>

                        <thead>

                            <tr>

                                <th>
                                    Item
                                </th>

                                <th class="number">
                                    Quantity
                                </th>

                                <th class="number">
                                    Unit Price
                                </th>

                                <th class="number">
                                    Total
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            <tr>

                                <td>
                                    Copper
                                </td>

                                <td class="number">

                                    ${
                                        number(
                                            getTotalCopperLength()
                                        )
                                    }

                                    m

                                </td>

                                <td class="number">

                                    ${
                                        money(
                                            quotation.copperRate
                                        )
                                    }

                                </td>

                                <td class="number">

                                    ${money(copper)}

                                </td>

                            </tr>

                        </tbody>

                    </table>

                </div>

            </div>


            <!-- =============================================
                 DRAINAGE AND ACCESSORIES
            ============================================== -->

            <div class="quotation-section">

                <h3>
                    3. DRAINAGE AND ACCESSORIES
                </h3>


                <div style="overflow-x:auto">

                    <table>

                        <thead>

                            <tr>

                                <th>
                                    Item
                                </th>

                                <th class="number">
                                    Quantity
                                </th>

                                <th class="number">
                                    Unit Price
                                </th>

                                <th class="number">
                                    Total
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            <tr>

                                <td>
                                    Drainage
                                </td>

                                <td class="number">

                                    ${
                                        number(
                                            getTotalDrainageLength()
                                        )
                                    }

                                    m

                                </td>

                                <td class="number">

                                    ${
                                        money(
                                            quotation.drainageRate
                                        )
                                    }

                                </td>

                                <td class="number">

                                    ${money(drainage)}

                                </td>

                            </tr>

                        </tbody>

                    </table>

                </div>

            </div>


            <!-- =============================================
                 INSTALLATION COMMISSIONING & ACCESSORIES
            ============================================== -->
            <div class="quotation-section">

                <h3>
                    4. INSTALLATION COMMISSIONING & ACCESSORIES
                </h3>


                <div style="overflow-x:auto">

                    <table>

                        <thead>

                            <tr>

                                <th>
                                    Item
                                </th>

                                <th class="number">
                                    Quantity
                                </th>

                                <th class="number">
                                    Unit Price
                                </th>

                                <th class="number">
                                    Total
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            <tr>

                                <td>

                                    Installation Commissioning

                                    <br>

                                    <small>

                                        ${
                                            escapeHTML(
                                                quotation.installationRegion
                                            )
                                        }

                                        —

                                        ${
                                            escapeHTML(
                                                quotation.acType
                                            )
                                        }

                                    </small>

                                </td>


                                <td class="number">

                                    ${
                                        number(
                                            quotation.installationUnitCount
                                        )
                                    }

                                    units

                                </td>


                                <td class="number">

                                    ${
                                        money(
                                            quotation.installationUnitCost
                                        )
                                    }

                                </td>


                                <td class="number">

                                    ${money(installation)}

                                </td>

                            </tr>


                            ${
                                quotation.additionalItems

                                    .map(item => `

                                        <tr>

                                            <td>

                                                ${
                                                    escapeHTML(
                                                        item.name
                                                    )
                                                }

                                            </td>


                                            <td class="number">

                                                ${
                                                    number(
                                                        item.quantity
                                                    )
                                                }

                                                ${
                                                    escapeHTML(
                                                        item.unit
                                                    )
                                                }

                                            </td>


                                            <td class="number">

                                                ${
                                                    money(
                                                        item.unitPrice
                                                    )
                                                }

                                            </td>


                                            <td class="number">

                                                ${
                                                    money(
                                                        item.total
                                                    )
                                                }

                                            </td>

                                        </tr>

                                    `)

                                    .join("")
                            }

                        </tbody>

                    </table>

                </div>

            </div>


            <!-- =============================================
                 QUOTATION SUMMARY
            ============================================== -->

            <div class="quotation-section">

                <h3>
                    QUOTATION SUMMARY
                </h3>


                <div style="overflow-x:auto">

                    <table>

                        <thead>

                            <tr>

                                <th>
                                    Description
                                </th>

                                <th class="number">
                                    Quantity
                                </th>

                                <th class="number">
                                    Unit Price
                                </th>

                                <th class="number">
                                    Total
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            <tr>

                                <td>
                                    Total HVAC Works
                                </td>

                                <td class="number">
                                    1 lot
                                </td>

                                <td class="number">

                                    ${
                                        money(
                                            getHVACTotal()
                                        )
                                    }

                                </td>

                                <td class="number">

                                    ${
                                        money(
                                            getHVACTotal()
                                        )
                                    }

                                </td>

                            </tr>


                            ${
                                quotation.includePreliminaries

                                    ? `

                                        <tr>

                                            <td>
                                                Preliminaries
                                            </td>

                                            <td class="number">
                                                1 lot
                                            </td>

                                            <td class="number">

                                                ${
                                                    money(
                                                        quotation
                                                            .preliminariesCost
                                                    )
                                                }

                                            </td>

                                            <td class="number">

                                                ${
                                                    money(
                                                        preliminaries
                                                    )
                                                }

                                            </td>

                                        </tr>

                                    `

                                    : ""
                            }


                            ${
                                quotation.includeAsBuiltDrawing

                                    ? `

                                        <tr>

                                            <td>
                                                As-Built Drawing
                                            </td>

                                            <td class="number">
                                                1 lot
                                            </td>

                                            <td class="number">

                                                ${
                                                    money(
                                                        quotation
                                                            .asBuiltDrawingCost
                                                    )
                                                }

                                            </td>

                                            <td class="number">

                                                ${
                                                    money(
                                                        asBuilt
                                                    )
                                                }

                                            </td>

                                        </tr>

                                    `

                                    : ""
                            }

                        </tbody>

                    </table>

                </div>


                <div
                    style="
                        margin-top:15px;
                    "
                >

                    <p
                        style="
                            display:flex;
                            justify-content:space-between;
                            gap:15px;
                        "
                    >

                        <span>
                            Total Before VAT:
                        </span>

                        <strong>
                            ${money(subtotal)}
                        </strong>

                    </p>


                    <p
                        style="
                            display:flex;
                            justify-content:space-between;
                            gap:15px;
                        "
                    >

                        <span>
                            VAT @ 16%:
                        </span>

                        <strong>
                            ${money(vat)}
                        </strong>

                    </p>


                    <div class="grand-total">

                        <span>
                            TOTAL COST INCLUSIVE OF 16% VAT
                        </span>

                        <span>
                            ${money(grandTotal)}
                        </span>

                    </div>

                </div>

            </div>

        </div>


        <!-- =================================================
             PREVIEW CONTROLS

             These buttons are outside finalQuotationDocument
             and are not included in the generated PDF.
        ================================================== -->

        <div class="preview-controls">

            <button
                type="button"
                class="secondary-button"
                onclick="backToClientDetails()"
            >
                ← Back
            </button>


            <button
                type="button"
                class="primary-button"
                onclick="generateQuotation()"
            >
                Generate PDF
            </button>

        </div>

    `;

    if (isSupplyOnly()) {
        container.querySelectorAll(".quotation-section").forEach(section => {
            const heading = section.querySelector("h3")?.textContent.trim() || "";
            if (/^[234]\./.test(heading)) section.remove();
        });
    }
}


/* =========================================================
   RETURN TO CLIENT DETAILS
   ========================================================= */

function backToClientDetails() {

    getClientDetails();


    showPage(13);
}

/* =========================================================
   SECTION 6 OF 7
   PDF HELPERS + SUMMARY + TERMS + PDF COMPLETION
   ========================================================= */


/* =========================================================
   CONVERT IMAGE TO DATA URL
   ========================================================= */

function imageToDataURL(url) {

    return new Promise(
        (resolve, reject) => {

            const image =
                new Image();


            image.onload =
                function () {

                    try {

                        const canvas =
                            document.createElement(
                                "canvas"
                            );


                        canvas.width =
                            image.naturalWidth;


                        canvas.height =
                            image.naturalHeight;


                        const context =
                            canvas.getContext(
                                "2d"
                            );


                        if (!context) {

                            reject(
                                new Error(
                                    "Canvas is not supported."
                                )
                            );

                            return;
                        }


                        context.drawImage(
                            image,
                            0,
                            0
                        );


                        resolve(
                            canvas.toDataURL(
                                "image/jpeg",
                                0.95
                            )
                        );

                    } catch (error) {

                        reject(error);

                    }

                };


            image.onerror =
                function () {

                    reject(
                        new Error(
                            "Unable to load " +
                            url
                        )
                    );

                };


            image.src =
                url;

        }
    );
}


/* =========================================================
   ADD PDF HEADER IMAGE
   ========================================================= */

function addHeaderImage(
    doc,
    headerData
) {

    if (!headerData) {

        return;

    }


    const pageWidth =
        doc.internal.pageSize.getWidth();


    try {

        doc.addImage(
            headerData,
            "JPEG",
            0,
            0,
            pageWidth,
            42
        );

    } catch (error) {

        console.warn(
            "Header image could not be added.",
            error
        );

    }
}


/* =========================================================
   ADD PDF FOOTER IMAGE
   ========================================================= */

function addFooterToPage(
    doc,
    footerData,
    pageNumber
) {

    const pageWidth =
        doc.internal.pageSize.getWidth();


    const pageHeight =
        doc.internal.pageSize.getHeight();


    try {

        if (footerData) {

            doc.addImage(
                footerData,
                "JPEG",
                0,
                pageHeight - 35,
                pageWidth,
                35
            );

        }

    } catch (error) {

        console.warn(
            "Footer image could not be added.",
            error
        );

    }


    doc.setFontSize(7);


    doc.setTextColor(
        100,
        100,
        100
    );


    doc.text(
        `Page ${pageNumber}`,
        pageWidth - 25,
        pageHeight - 5
    );
}


/* =========================================================
   GENERATE QUOTATION
   ========================================================= */

async function generateQuotation() {

    getClientDetails();


    if (!quotation.clientName) {

        alert(
            "Please enter the client name."
        );

        showPage(13);

        return;
    }


    if (
        !quotation.installationLocation
    ) {

        alert(
            "Please enter the installation location." );

        showPage(13);

        return;
    }


    if (!jsPDFConstructor) {

        alert(
            "The PDF library could not be loaded. Please check your internet connection and reload the page."
        );

        return;
    }


    let headerData = null;

    let footerData = null;


    /*
       header.jpeg and footer.jpeg must be stored in the
       same GitHub Pages folder as index.html.

       The images are converted into data URLs before the
       PDF is generated.
    */

    try {

        headerData =
            await imageToDataURL(
                "header.jpeg"
            );

    } catch (error) {

        console.warn(
            "header.jpeg could not be loaded.",
            error
        );

    }


    try {

        footerData =
            await imageToDataURL(
                "footer.jpeg"
            );

    } catch (error) {

        console.warn(
            "footer.jpeg could not be loaded.",
            error
        );

    }


    try {

        createPDF(
            headerData,
            footerData
        );

    } catch (error) {

        console.error(
            "PDF generation error:",
            error
        );


        alert(
            "The quotation could not be generated. Please check the browser console for details."
        );

    }
}


/* =========================================================
   PDF SUMMARY + TERMS + FOOTERS + SAVE
   ========================================================= */

function createPDFSummaryAndFinish(
    doc,
    headerData,
    footerData,
    pageWidth,
    pageHeight,
    margin,
    headerHeight,
    footerHeight,
    startY
) {

    let y =
        Number(startY) ||
        headerHeight + 8;


    const equipmentTotal =
        getEquipmentTotal();


    const copperTotal =
        getCopperTotal();


    const drainageTotal =
        getDrainageTotal();


    const installationTotal =
        getInstallationCommissioningTotal();


    const additionalItemsTotal =
        getAdditionalItemsTotal();


    const preliminariesTotal =
        getPreliminariesTotal();


    const asBuiltDrawingTotal =
        getAsBuiltDrawingTotal();


    const subtotal =
        getQuotationSubtotal();


    const vat =
        getQuotationVAT();


    const grandTotal =
        getQuotationGrandTotal();


    /* =====================================================
       ADD A NEW PDF PAGE
       ===================================================== */

    function addNewPDFPage() {

        doc.addPage();


        addHeaderImage(
            doc,
            headerData
        );


        y =
            headerHeight + 8;
    }


    /* =====================================================
       CHECK SPACE FOR SUMMARY
       ===================================================== */

    if (
        y >
        pageHeight -
        footerHeight -
        90
    ) {

        addNewPDFPage();

    }


    /* =====================================================
       SUMMARY HEADING
       ===================================================== */

    doc.setFont(
        "helvetica",
        "bold"
    );


    doc.setFontSize(12);


    doc.setTextColor(
        7,
        89,
        133
    );


    doc.text(
        "QUOTATION SUMMARY",
        margin,
        y
    );


    y += 5;


    /* =====================================================
       SUMMARY ROWS
       ===================================================== */

    const summaryRows = [];


    if (equipmentTotal > 0) {

        summaryRows.push([

            "AC Equipment",

            "1 lot",

            money(
                equipmentTotal
            ),

            money(
                equipmentTotal
            )

        ]);

    }


    if (copperTotal > 0) {

        summaryRows.push([

            "Copper Piping",

            `${
                number(
                    getTotalCopperLength()
                )
            } m`,

            money(
                quotation.copperRate
            ),

            money(
                copperTotal
            )

        ]);

    }


    if (drainageTotal > 0) {

        summaryRows.push([

            "Drainage Piping",

            `${
                number(
                    getTotalDrainageLength()
                )
            } m`,

            money(
                quotation.drainageRate
            ),

            money(
                drainageTotal
            )

        ]);

    }


    if (installationTotal > 0) {

        summaryRows.push([

            "Installation and Commissioning",

            `${
                Number(
                    quotation.installationUnitCount
                ) || 0
            } units`,

            money(
                quotation.installationUnitCost
            ),

            money(
                installationTotal
            )

        ]);

    }


    if (additionalItemsTotal > 0) {

        summaryRows.push([

            "Accessories / Additional Items",

            "1 lot",

            money(
                additionalItemsTotal
            ),

            money(
                additionalItemsTotal
            )

        ]);

    }


    if (preliminariesTotal > 0) {

        summaryRows.push([

            "Preliminaries",

            "1 lot",

            money(
                preliminariesTotal
            ),

            money(
                preliminariesTotal
            )

        ]);

    }


    if (asBuiltDrawingTotal > 0) {

        summaryRows.push([

            "As-Built Drawing",

            "1 lot",

            money(
                asBuiltDrawingTotal
            ),

            money(
                asBuiltDrawingTotal
            )

        ]);

    }


    if (
        summaryRows.length === 0
    ) {

        summaryRows.push([

            "Quotation Items",

            "1 lot",

            money(0),

            money(0)

        ]);

    }


    /* =====================================================
       SUMMARY TABLE
       ===================================================== */

    doc.autoTable({

        startY:
            y,


        head: [[

            "Description",

            "Quantity",

            "Unit Price",

            "Total"

        ]],


        body:
            summaryRows,


        theme:
            "grid",


        headStyles: {

            fillColor: [
                7,
                89,
                133
            ],

            textColor:
                255,

            fontStyle:
                "bold"

        },


        styles: {

            fontSize:
                8,

            cellPadding:
                2.5,

            valign:
                "middle"

        },


        columnStyles: {

            0: {

                cellWidth:
                    70

            },

            1: {

                cellWidth:
                    28

            },

            2: {

                cellWidth:
                    42,

                halign:
                    "right"

            },

            3: {

                cellWidth:
                    42,

                halign:
                    "right"

            }

        },


        margin: {

            left:
                margin,

            right:
                margin,

            bottom:
                footerHeight

        }

    });


    y =
        doc.lastAutoTable.finalY +
        8;


    /* =====================================================
       CHECK SPACE FOR TOTALS
       ===================================================== */

    if (
        y >
        pageHeight -
        footerHeight -
        45
    ) {

        addNewPDFPage();

    }


    /* =====================================================
       SUBTOTAL
       ===================================================== */

    doc.setFont(
        "helvetica",
        "normal"
    );


    doc.setFontSize(10);


    doc.setTextColor(
        30,
        41,
        59
    );


    doc.text(
        "Subtotal before VAT:",
        margin,
        y
    );


    doc.text(
        money(subtotal),
        pageWidth - margin,
        y,
        {
            align:
                "right"
        }
    );


    y += 7;


    /* =====================================================
       VAT
       ===================================================== */

    doc.text(
        "VAT @ 16%:",
        margin,
        y
    );


    doc.text(
        money(vat),
        pageWidth - margin,
        y,
        {
            align:
                "right"
        }
    );


    y += 10;


    /* =====================================================
       GRAND TOTAL BOX
       ===================================================== */

    doc.setFillColor(
        7,
        89,
        133
    );


    doc.roundedRect(
        margin,
        y - 5,
        pageWidth - margin * 2,
        17,
        2,
        2,
        "F"
    );


    doc.setFont(
        "helvetica",
        "bold"
    );


    doc.setFontSize(11);


    doc.setTextColor(
        255,
        255,
        255
    );


    doc.text(
        "TOTAL COST INCLUSIVE OF 16% VAT",
        margin + 4,
        y + 5
    );


    doc.text(
        money(grandTotal),
        pageWidth - margin - 4,
        y + 5,
        {
            align:
                "right"
        }
    );


    y += 24;


    /* =====================================================
       CHECK SPACE FOR TERMS
       ===================================================== */

    if (
        y >
        pageHeight -
        footerHeight -
        75
    ) {

        addNewPDFPage();

    }


    /* =====================================================
       TERMS AND CONDITIONS HEADING
       ===================================================== */

    doc.setFont(
        "helvetica",
        "bold"
    );


    doc.setFontSize(11);


    doc.setTextColor(
        7,
        89,
        133
    );


    doc.text(
        "TERMS AND CONDITIONS OF SALES",
        margin,
        y
    );


    y += 6;


    /* =====================================================
       TERMS AND CONDITIONS
       ===================================================== */

    const terms = [

        [

            "Terms of payment:",

            "100% advance payment payable to HOTPOINT APPLIANCES LTD or as per approved payment terms."

        ],


        [

            "Warranty:",

            "Two years warranty on equipment. The warranty shall apply according to the applicable warranty conditions."

        ],


        [

            "Delivery timelines:",

            "Delivery is expected within 8–12 weeks after order confirmation and receipt of the required advance payment."

        ],


        [

            "Quotation validity:",

            "This quotation is valid for 14 days from the quotation date."

        ],


        [

            "Scope:",

            "The scope of work is limited to the items included in the priced bill of quantities."

        ],


        [

            "Exclusions:",

            "Scaffolding, glass cutting, electrical work, masonry work, wall chasing, drilling and work on false ceilings are excluded unless specifically included."

        ],


        [

            "Electrical works:",

            "Electrical power supplies for the air conditioners shall be provided by the client. Guidance on the required supplies can be provided."

        ],


        [

            "Site support:",

            "The client shall provide site access, water, electricity and safe storage for equipment, tools and installation materials."

        ],


        [

            "Operating temperature:",

            "The recommended operating temperature range for the air-conditioning system is 18–30 degrees Celsius."

        ]

    ];


    /* =====================================================
       TERMS TABLE
       ===================================================== */

    doc.autoTable({

        startY:
            y,


        body:
            terms,


        theme:
            "plain",


        styles: {

            fontSize:
                7.5,

            cellPadding:
                2,

            textColor: [
                40,
                40,
                40
            ],

            valign:
                "top",

            overflow:
                "linebreak"

        },


        columnStyles: {

            0: {

                fontStyle:
                    "bold",

                cellWidth:
                    38,

                textColor: [
                    7,
                    89,
                    133
                ]

            },


            1: {

                cellWidth:

                    pageWidth -
                    margin * 2 -
                    38

            }

        },


        margin: {

            left:
                margin,

            right:
                margin,

            top:
                headerHeight + 5,

            bottom:
                footerHeight

        },


        didDrawPage:
            function (data) {

                /*
                   AutoTable may create additional pages when
                   the terms do not fit on the current page.
                */

                if (
                    data.pageNumber > 1 &&
                    headerData
                ) {

                    addHeaderImage(
                        doc,
                        headerData
                    );

                }

            }

    });


    /* =====================================================
       ADD FOOTERS TO EVERY PAGE
       ===================================================== */

    const totalPages =
        doc.internal.getNumberOfPages();


    for (
        let pageNumber = 1;
        pageNumber <= totalPages;
        pageNumber++
    ) {

        doc.setPage(
            pageNumber
        );


        addFooterToPage(
            doc,
            footerData,
            pageNumber
        );

    }


    /* =====================================================
       CREATE A SAFE PDF FILENAME
       ===================================================== */

    const safeClientName =

        String(
            quotation.clientName ||
            "Client"
        )

            .trim()

            .replace(
                /[^a-z0-9]+/gi,
                "_"
            )

            .replace(
                /^_+|_+$/g,
                ""
            );


    const filename =

        `HVAC_Quotation_${
            safeClientName ||
            "Client"
        }.pdf`;


    /* =====================================================
       DOWNLOAD PDF
       ===================================================== */

    doc.save(
        filename
    );


    /* =====================================================
       DISPLAY SUCCESS PAGE
       ===================================================== */

    showPage(15);
}

/* =========================================================
   SECTION 7 OF 7
   PDF DOCUMENT + RESET + INITIALIZATION
   ========================================================= */


/* =========================================================
   TOTAL COPPER LENGTH

   Included here to ensure the function is available to the
   quotation preview and PDF calculations.
   ========================================================= */

function getTotalCopperLength() {

    return quotation.rooms.reduce(

        (sum, room) =>

            sum +
            Number(
                room.copper || 0
            ),

        0

    );
}


/* =========================================================
   TOTAL DRAINAGE LENGTH
   ========================================================= */

function getTotalDrainageLength() {

    return quotation.rooms.reduce(

        (sum, room) =>

            sum +
            Number(
                room.drainage || 0
            ),

        0

    );
}


/* =========================================================
   CREATE THE PDF DOCUMENT
   ========================================================= */

function createPDF(
    headerData,
    footerData
) {

    const doc =
        new jsPDFConstructor({

            orientation:
                "portrait",

            unit:
                "mm",

            format:
                "a4"

        });


    const pageWidth =
        doc.internal.pageSize.getWidth();


    const pageHeight =
        doc.internal.pageSize.getHeight();


    const margin =
        12;


    const headerHeight =
        45;const footerHeight =
        38;


    addHeaderImage(
        doc,
        headerData
    );


    let y =
        headerHeight + 5;


    /* =====================================================
       PDF TITLE
       ===================================================== */

    doc.setFont(
        "helvetica",
        "bold"
    );


    doc.setFontSize(18);


    doc.setTextColor(
        7,
        89,
        133
    );


    doc.text(
        "QUOTATION",
        pageWidth / 2,
        y,
        {
            align:
                "center"
        }
    );


    y += 10;


    /* =====================================================
       CLIENT DETAILS
       ===================================================== */

    doc.setFontSize(9);


    doc.setTextColor(
        30,
        41,
        59
    );


    const clientRows = [

        [
            "CLIENT:",
            quotation.clientName
        ],

        [
            "LOCATION:",
            quotation.installationLocation
        ],

        [
            "SALES PERSON:",
            quotation.salesPerson
        ],

        [
            "PHONE:",
            quotation.salesPhone
        ],

        [
            "EMAIL:",
            quotation.salesEmail
        ]

    ];


    clientRows.forEach(
        row => {

            doc.setFont(
                "helvetica",
                "bold"
            );


            doc.text(
                row[0],
                margin,
                y
            );


            doc.setFont(
                "helvetica",
                "normal"
            );


            doc.text(
                String(
                    row[1] || ""
                ),
                margin + 32,
                y
            );


            y += 5;

        }
    );


    y += 5;


    /* =====================================================
       EQUIPMENT
       ===================================================== */

    doc.setFont(
        "helvetica",
        "bold"
    );


    doc.setFontSize(11);


    doc.text(
        "1. EQUIPMENT",
        margin,
        y
    );


    y += 3;


    const equipmentRows =

        quotation.acPrices.map(
            item => [

                `${
                    item.brand ||
                    "LG"
                } — ${
                    Number(
                        item.capacity
                    ).toLocaleString(
                        "en-KE"
                    )
                } BTU/hr — ${
                    item.type ||
                    "HIGHWALL"
                }\nRoom(s): ${
                    Array.isArray(
                        item.rooms
                    )

                        ? item.rooms.join(", ")
                        : ""
                }`,

                Number(
                    item.quantity
                ) || 0,

                money(
                    item.unitPrice
                ),

                money(
                    item.total
                )

            ]
        );


    doc.autoTable({

        startY:
            y,


        head: [[

            "Brand / Capacity / Type / Room(s)",

            "Qty",

            "Unit Price",

            "Total"

        ]],


        body:
            equipmentRows,


        theme:
            "grid",


        headStyles: {

            fillColor: [
                7,
                89,
                133
            ],

            textColor:
                255,

            fontStyle:
                "bold"

        },


        styles: {

            fontSize:
                8,

            cellPadding:
                2.5,

            valign:
                "middle",

            overflow:
                "linebreak"

        },


        columnStyles: {

            0: {

                cellWidth:
                    82

            },

            1: {

                cellWidth:
                    18,

                halign:
                    "right"

            },

            2: {

                cellWidth:
                    40,

                halign:
                    "right"

            },

            3: {

                cellWidth:
                    42,

                halign:
                    "right"

            }

        },


        margin: {

            left:
                margin,

            right:
                margin,

            top:
                headerHeight + 5,

            bottom:
                footerHeight

        },


        didDrawPage:
            function (data) {

                if (
                    data.pageNumber > 1 &&
                    headerData
                ) {

                    addHeaderImage(
                        doc,
                        headerData
                    );

                }

            }

    });


    y =
        doc.lastAutoTable.finalY +
        8;

    if (isSupplyOnly()) {
        createPDFSummaryAndFinish(
            doc,
            headerData,
            footerData,
            pageWidth,
            pageHeight,
            margin,
            headerHeight,
            footerHeight,
            y
        );
        return;
    }


    /* =====================================================
       CHECK SPACE FOR COPPER TABLE
       ===================================================== */

    if (
        y >
        pageHeight -
        footerHeight -
        50
    ) {

        doc.addPage();


        addHeaderImage(
            doc,
            headerData
        );


        y =
            headerHeight + 8;

    }


    /* =====================================================
       COPPER AND ACCESSORIES
       ===================================================== */

    doc.setFont(
        "helvetica",
        "bold"
    );


    doc.setFontSize(11);


    doc.setTextColor(
        30,
        41,
        59
    );


    doc.text(
        "2. COPPER AND ACCESSORIES",
        margin,
        y
    );


    y += 3;


    doc.autoTable({

        startY:
            y,


        head: [[

            "Item",

            "Quantity",

            "Unit Price",

            "Total"

        ]],


        body: [[

            "Copper",

            `${
                number(
                    getTotalCopperLength()
                )
            } m`,

            money(
                quotation.copperRate
            ),

            money(
                getCopperTotal()
            )

        ]],


        theme:
            "grid",


        headStyles: {

            fillColor: [
                7,
                89,
                133
            ],

            textColor:
                255,

            fontStyle:
                "bold"

        },


        styles: {

            fontSize:
                8,

            cellPadding:
                2.5

        },


        columnStyles: {

            1: {

                halign:
                    "right"

            },

            2: {

                halign:
                    "right"

            },

            3: {

                halign:
                    "right"

            }

        },


        margin: {

            left:
                margin,

            right:
                margin,

            top:
                headerHeight + 5,

            bottom:
                footerHeight

        }

    });


    y =
        doc.lastAutoTable.finalY +
        8;


    /* =====================================================
       CHECK SPACE FOR DRAINAGE TABLE
       ===================================================== */

    if (
        y >
        pageHeight -
        footerHeight -
        50
    ) {

        doc.addPage();


        addHeaderImage(
            doc,
            headerData
        );


        y =
            headerHeight + 8;

    }


    /* =====================================================
       DRAINAGE AND ACCESSORIES
       ===================================================== */

    doc.setFont(
        "helvetica",
        "bold"
    );


    doc.setFontSize(11);


    doc.text(
        "3. DRAINAGE AND ACCESSORIES",
        margin,
        y
    );


    y += 3;


    doc.autoTable({

        startY:
            y,


        head: [[

            "Item",

            "Quantity",

            "Unit Price",

            "Total"

        ]],


        body: [[

            "Drainage",

            `${
                number(
                    getTotalDrainageLength()
                )
            } m`,

            money(
                quotation.drainageRate
            ),

            money(
                getDrainageTotal()
            )

        ]],


        theme:
            "grid",


        headStyles: {

            fillColor: [
                7,
                89,
                133
            ],

            textColor:
                255,

            fontStyle:
                "bold"

        },


        styles: {

            fontSize:
                8,

            cellPadding:
                2.5

        },


        columnStyles: {

            1: {

                halign:
                    "right"

            },

            2: {

                halign:
                    "right"

            },

            3: {

                halign:
                    "right"

            }

        },


        margin: {

            left:
                margin,

            right:
                margin,

            top:
                headerHeight + 5,

            bottom:
                footerHeight

        }

    });


    y =
        doc.lastAutoTable.finalY +
        8;


    /* =====================================================
       CHECK SPACE FOR INSTALLATION AND ACCESSORIES
       ===================================================== */

    if (
        y >
        pageHeight -
        footerHeight -
        80
    ) {

        doc.addPage();


        addHeaderImage(
            doc,
            headerData
        );


        y =
            headerHeight + 8;

    }


    /* =====================================================
       INSTALLATION COMMISSIONING & ACCESSORIES
       ===================================================== */

    doc.setFont(
        "helvetica",
        "bold"
    );


    doc.setFontSize(11);


    doc.text(
        "4. INSTALLATION COMMISSIONING & ACCESSORIES",
        margin,
        y
    );


    y += 3;


    const additionalWorksRows = [

        [

            `Installation Commissioning\n${
                quotation.installationRegion ||
                ""
            } — ${
                quotation.acType ||
                ""
            }`,

            `${
                number(
                    quotation.installationUnitCount
                )
            } units`,

            money(
                quotation.installationUnitCost
            ),

            money(
                getInstallationCommissioningTotal()
            )

        ],


        ...quotation.additionalItems.map(
            item => [

                item.name,

                `${
                    number(
                        item.quantity
                    )
                } ${
                    item.unit
                }`,

                money(
                    item.unitPrice
                ),

                money(
                    item.total
                )

            ]
        )

    ];


    doc.autoTable({

        startY:
            y,


        head: [[

            "Item",

            "Quantity",

            "Unit Price",

            "Total"

        ]],


        body:
            additionalWorksRows,


        theme:
            "grid",


        headStyles: {

            fillColor: [
                7,
                89,
                133
            ],

            textColor:
                255,

            fontStyle:
                "bold"

        },


        styles: {

            fontSize:
                8,

            cellPadding:
                2.5,

            overflow:
                "linebreak"

        },


        columnStyles: {

            0: {

                cellWidth:
                    72

            },

            1: {

                cellWidth:
                    28,

                halign:
                    "right"

            },

            2: {

                cellWidth:
                    40,

                halign:
                    "right"

            },

            3: {

                cellWidth:
                    42,

                halign:
                    "right"

            }

        },


        margin: {

            left:
                margin,

            right:
                margin,

            top:
                headerHeight + 5,

            bottom:
                footerHeight

        },


        didDrawPage:
            function (data) {

                if (
                    data.pageNumber > 1 &&
                    headerData
                ) {

                    addHeaderImage(
                        doc,
                        headerData
                    );

                }

            }

    });


    y =
        doc.lastAutoTable.finalY +
        8;


    /* =====================================================
       SUMMARY + TERMS + FOOTERS + SAVE
       ===================================================== */

    createPDFSummaryAndFinish(

        doc,

        headerData,

        footerData,

        pageWidth,

        pageHeight,

        margin,

        headerHeight,

        footerHeight,

        y

    );
}


/* =========================================================
   START A NEW QUOTATION
   ========================================================= */

function startNewQuotation() {

    quotation = {

        quotationType:
            "",

        rooms: [],

        copperRate:
            3200,

        drainageRate:
            0,

        installationRegion:
            "",

        acType:
            "",

        installationUnitCost:
            0,

        installationUnitCount:
            0,

        installationTotal:
            0,

        additionalItems: [],

        includePreliminaries:
            false,

        preliminariesCost:
            15000,

        includeAsBuiltDrawing:
            false,

        asBuiltDrawingCost:
            5000,

        acPrices: [],

        clientName:
            "",

        installationLocation:
            "",

        salesPerson:
            "",

        salesPhone:
            "",

        salesEmail:
            ""

    };


    const roomContainer =
        document.getElementById(
            "roomInputContainer"
        );


    if (roomContainer) {

        roomContainer.innerHTML = `

            <div class="input-row room-input-row">

                <input
                    type="text"
                    class="room-name-input"
                    placeholder="e.g. Living Room"
                >

                <button
                    type="button"
                    class="remove-input"
                    onclick="removeRoomInput(this)"
                >
                    ×
                </button>

            </div>

        `;

    }


    [

        "clientName",

        "installationLocation",

        "salesPerson",

        "salesPhone",

        "salesEmail"

    ].forEach(id => {

        const element =
            document.getElementById(id);


        if (element) {

            element.value =
                "";

        }

    });


    const quotationPreview =
        document.getElementById(
            "quotationPreview"
        );


    if (quotationPreview) {

        quotationPreview.innerHTML =
            "";

    }


    showPage(0);
}


/* =========================================================
   PAGE INITIALIZATION
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        /*
           Refresh the jsPDF constructor in case the PDF
           library finished loading after script.js.
        */

        if (
            window.jspdf &&
            typeof window.jspdf.jsPDF ===
            "function"
        ) {

            jsPDFConstructor =
                window.jspdf.jsPDF;

        }


        const year =
            document.getElementById(
                "currentYear"
            );


        if (year) {

            year.textContent =
                new Date()
                    .getFullYear();

        }


        showPage(0);

    }
);
