import {
    ActivityIndicator,
    FlatList,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from "react-native";
import React, {useState} from "react";

import {OwnUpload, YourUpload} from "./YourUpload";
import {ZoomableImage} from "./ZoomableImage";
import {perk} from "@/app/_utils/colors";

export type UploadTag = {code: string; label: string};

/** Another person's upload: its photo and tags only, never its figures. */
export type SharedUpload = {
    id: string;
    mine: false;
    agrees_with: string | null;
    /** A copy with no metadata; opens with the sign-in token. */
    photo: string;
    tags: UploadTag[];
    may_agree: boolean;
};

export type StationUpload =
    | SharedUpload
    | (OwnUpload & {mine: true; agrees_with: string | null; tags: UploadTag[]});

export type StationUploadList = {
    uploads: StationUpload[];
    /** Someone else uploaded and this person has not. */
    may_disagree: boolean;
};

/**
 * Every upload of this station and race the person may see, one card each,
 * to swipe through: their own first, then everyone else's, oldest first
 *.
 */
export function StationUploads({
    list,
    levelLabel,
    token,
    header,
    bottomOffset,
    onAgree,
    onDisagree,
}: {
    list: StationUploadList;
    levelLabel: string;
    token: string;
    header: React.ReactNode;
    /** Distance from the bottom edge to the buttons, clearing the tab bar. */
    bottomOffset: number;
    onAgree: (uploadId: string) => void;
    onDisagree: () => void;
}) {
    const {width} = useWindowDimensions();
    const [page, setPage] = useState(0);
    const count = list.uploads.length;
    const current = list.uploads[Math.min(page, count - 1)];
    // Agree acts on the card showing.
    const mayAgree = !!current && !current.mine && current.may_agree;
    const showButtons = mayAgree || list.may_disagree;
    // Room under each card for the buttons floating over it.
    const bottomRoom = bottomOffset + (showButtons ? BUTTON_HEIGHT + 28 : 16);
    // Half the row each, the same whether one button shows or two.
    const buttonWidth = (width - 2 * BUTTONS_GUTTER - BUTTONS_GAP) / 2;

    return (
        <View style={styles.wrapper}>
            {header}
            <FlatList
                data={list.uploads}
                keyExtractor={(upload) => upload.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(event) =>
                    setPage(Math.round(event.nativeEvent.contentOffset.x / width))
                }
                renderItem={({item}) => (
                    <ScrollView
                        style={{width}}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{paddingBottom: bottomRoom}}
                    >
                        {count > 1 ? <Dots count={count} current={page} /> : null}
                        {item.mine ? (
                            <>
                                <Tags tags={item.tags} />
                                <YourUpload
                                    upload={item}
                                    levelLabel={levelLabel}
                                    token={token}
                                />
                            </>
                        ) : (
                            <SharedCard upload={item} token={token} />
                        )}
                    </ScrollView>
                )}
            />
            {showButtons ? (
                <View style={[styles.buttons, {bottom: bottomOffset}]}>
                    {list.may_disagree ? (
                        <Pressable
                            style={({pressed}) => [
                                styles.button,
                                {width: buttonWidth},
                                styles.disagree,
                                pressed && styles.pressed,
                            ]}
                            onPress={onDisagree}
                            accessibilityRole="button"
                        >
                            <Text style={styles.disagreeText}>Disagree</Text>
                        </Pressable>
                    ) : null}
                    {mayAgree ? (
                        <Pressable
                            style={({pressed}) => [
                                styles.button,
                                {width: buttonWidth},
                                styles.agree,
                                pressed && styles.pressed,
                            ]}
                            onPress={() => onAgree(current.id)}
                            accessibilityRole="button"
                        >
                            <Text style={styles.agreeText}>Agree</Text>
                        </Pressable>
                    ) : null}
                </View>
            ) : null}
        </View>
    );
}

function SharedCard({upload, token}: {upload: SharedUpload; token: string}) {
    const [photoState, setPhotoState] = useState<"loading" | "loaded" | "failed">(
        "loading",
    );
    const {height} = useWindowDimensions();

    return (
        <View style={styles.card}>
            <Tags tags={upload.tags} />
            <View style={[styles.photo, {height: 0.5 * height}]}>
                {photoState === "loading" ? (
                    <ActivityIndicator
                        style={StyleSheet.absoluteFill}
                        size="large"
                        color={perk.mute}
                        accessibilityLabel="Loading the photo"
                    />
                ) : null}
                {photoState === "failed" ? (
                    <Text style={styles.photoFailed}>Could not load the photo.</Text>
                ) : null}
                <ZoomableImage
                    uri={upload.photo}
                    headers={{Authorization: `Bearer ${token}`}}
                    onLoad={() => setPhotoState("loaded")}
                    onError={() => setPhotoState("failed")}
                    swipeable
                />
            </View>
        </View>
    );
}

function Tags({tags}: {tags: UploadTag[]}) {
    if (tags.length === 0) return null;
    return (
        <View style={styles.tags}>
            {tags.map((tag) => (
                <View key={tag.code} style={styles.tag}>
                    <Text style={styles.tagText}>{tag.label}</Text>
                </View>
            ))}
        </View>
    );
}

function Dots({count, current}: {count: number; current: number}) {
    return (
        <View
            style={styles.dots}
            accessibilityLabel={`Upload ${current + 1} of ${count}`}
        >
            {Array.from({length: count}, (_, index) => (
                <View
                    key={index}
                    style={[styles.dot, index === current && styles.dotCurrent]}
                />
            ))}
        </View>
    );
}

const BUTTON_HEIGHT = 54;
const BUTTONS_GUTTER = 16;
const BUTTONS_GAP = 12;

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
    },
    card: {
        paddingHorizontal: 8,
        gap: 8,
    },
    photo: {
        borderRadius: 14,
        overflow: "hidden",
        backgroundColor: perk.surface,
    },
    photoFailed: {
        position: "absolute",
        top: "45%",
        left: 0,
        right: 0,
        textAlign: "center",
        fontSize: 15,
        color: perk.mute,
    },
    tags: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 6,
        paddingHorizontal: 8,
        paddingTop: 8,
    },
    tag: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
        backgroundColor: perk.ink,
    },
    tagText: {
        fontSize: 13,
        fontWeight: "700",
        color: perk.paper,
    },
    dots: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 6,
        paddingTop: 10,
    },
    dot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: perk.rule16,
    },
    dotCurrent: {
        backgroundColor: perk.ink,
    },
    buttons: {
        position: "absolute",
        left: BUTTONS_GUTTER,
        right: BUTTONS_GUTTER,
        flexDirection: "row",
        justifyContent: "center",
        gap: BUTTONS_GAP,
    },
    button: {
        height: BUTTON_HEIGHT,
        borderRadius: BUTTON_HEIGHT / 2,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: perk.ink,
        shadowOffset: {width: 0, height: 6},
        shadowOpacity: 0.18,
        shadowRadius: 12,
        elevation: 6,
    },
    agree: {
        backgroundColor: perk.lime,
    },
    agreeText: {
        fontSize: 16,
        fontWeight: "800",
        color: perk.limeInk,
    },
    disagree: {
        backgroundColor: perk.ink,
    },
    disagreeText: {
        fontSize: 16,
        fontWeight: "800",
        color: perk.paper,
    },
    pressed: {
        transform: [{scale: 0.97}],
    },
});
