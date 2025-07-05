export const sampleElectionData = {
    // Polling Station Details
    pollingStation: "NAKA PRIMARY SCHOOL",
    pollingStationCode: "048 - 2 of 2",
    ward: "NAKURU TOWN EAST",
    wardCode: "0880",
    constituency: "NAKURU TOWN EAST",
    constituencyCode: "170",
    county: "NAKURU",
    countyCode: "032",

    // Form Details
    form34AImage: require("../../../assets/images/sample.jpg"),
    formNumber: "1297823",

    // Election Results
    candidates: [
        {
            name: "JANE DOE",
            party: "TAK",
            votes: 4,
        },
        {
            name: "JOHN SMITH",
            party: "ARC",
            votes: 2,
        },
        {
            name: "ALICE JOHNSON",
            party: "UDP",
            votes: 0,
        },
        {name: "BOB BROWN", party: "IND", votes: 1},
        {name: "CAROL WHITE", party: "JP", votes: 388},
        {name: "DAVID GREEN", party: "IND", votes: 0},
        {name: "EMILY BLACK", party: "IND", votes: 0},
        {name: "FRANK BLUE", party: "ODM", votes: 10},
    ],

    // Vote Summary
    totalValidVotes: 405,
    rejectedVotes: 5,
    disputedVotes: 0,
    totalVotesCast: 405,

    // Polling Station Counts
    registeredVoters: 630,
    rejectedBallotPapers: 5,
    rejectionObjectedBallotPapers: 0,

    // Officials
    presidingOfficer: "ENOCK MBOYA",
    deputyPresidingOfficer: "MAGARET WAIRIMU",

    // Timestamps
    declarationDate: "26/10/17",
    declarationTime: "Process was successful",
};
