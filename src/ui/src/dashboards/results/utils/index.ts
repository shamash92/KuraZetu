import {
    IAggregatedResults,
    ICandidateDetails,
    IPollingCenterCandidateResults,
    IPollingCenterResultsProcessed,
    TLevelDjango,
} from "../types";

// Format large numbers with commas
export const formatNumber = (num: number) => {
    return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
};

// Parse and aggregate candidate results across all streams
export function aggregateCandidateResults(
    data: IPollingCenterCandidateResults[],
    level: TLevelDjango,
): IAggregatedResults {
    // Map to hold aggregation per candidate id
    const candidateMap: Record<
        number,
        {
            fullName: string;
            party: string;
            party_color: string;
            totalVotes: number;
            countedStreams: number;
        }
    > = {};

    // Find total streams (unique polling_station.code + stream_number)
    const uniqueStreams = new Set(
        data.map(
            (item: IPollingCenterCandidateResults) =>
                `${item.polling_station.code}-${item.polling_station.stream_number}`,
        ),
    );
    const totalStreams = uniqueStreams.size;

    data.forEach((item: IPollingCenterCandidateResults) => {
        let candidate: ICandidateDetails | null = null;

        if (level === "president" && item.presidential_candidate) {
            candidate = item["presidential_candidate"];
        } else if (level === "governor" && item.governor_candidate) {
            candidate = item["governor_candidate"];
        } else if (level === "senator" && item.senator_candidate) {
            candidate = item["senator_candidate"];
        } else if (level === "women_rep" && item.woman_rep_candidate) {
            candidate = item["woman_rep_candidate"];
        } else if (level === "mp" && item.mp_candidate) {
            candidate = item["mp_candidate"];
        } else if (level === "mca" && item.mca_candidate) {
            candidate = item["mca_candidate"];
        }

        if (!candidate) {
            return; // Skip if candidate is not found for this item
        }

        const candidateId = candidate.id;
        const fullName = [candidate.first_name, candidate.last_name, candidate.surname]
            .filter(Boolean)
            .join(" ")
            .trim();

        if (!candidateMap[candidateId]) {
            candidateMap[candidateId] = {
                fullName,
                party: candidate.party,
                party_color: candidate.party_color,
                totalVotes: 0,
                countedStreams: 0,
            };
        }

        candidateMap[candidateId].totalVotes += item.votes;
        candidateMap[candidateId].countedStreams += 1;
    });

    // Calculate total votes for percentage
    const totalVotes = Object.values(candidateMap).reduce(
        (sum, c) => sum + c.totalVotes,
        0,
    );

    // Sort candidates by totalVotes descending
    const sortedCandidates: IPollingCenterResultsProcessed[] = Object.values(
        candidateMap,
    )
        .map((c) => ({
            ...c,
            percentage: totalVotes > 0 ? (c.totalVotes / totalVotes) * 100 : 0,
        }))
        .sort((a, b) => b.totalVotes - a.totalVotes);

    // Return as array, including totalStreams for reference and percentage for each candidate

    return {
        totalStreams,
        candidates: sortedCandidates,
        totalVotes,
    };
}
