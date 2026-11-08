import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import {Camera as CameraIcon} from "lucide-react-native";

import {AgreementChecklist} from "./AgreementChecklist";
import type {AgreementCheck} from "./prefill";
import {StepBar} from "./StepBar";
import {perk} from "@/app/_utils/colors";

type AgreementPaneProps =
    | {
          /** The photo is still being checked: lines spin, no buttons. */
          checking: true;
          checks: AgreementCheck[] | null;
      }
    | {
          checking?: false;
          checks: AgreementCheck[] | null;
          /** The server's sentence about the photo. */
          message: string;
          /** The photo matches the earlier upload: it can be submitted. */
          agrees: boolean;
          submitting: boolean;
          onSubmit: () => void;
          onRetake: () => void;
          /** Type the results from this photo instead. */
          onDisagree: () => void;
      };

/**
 * Agreeing with an earlier upload: each check on the photo, one line each,
 * while it runs and once it has ended. Then Submit when the photo matches;
 * otherwise Retake photo or Disagree.
 */
export function AgreementPane(props: AgreementPaneProps) {
    return (
        <View style={styles.body}>
            <ScrollView contentContainerStyle={styles.list}>
                <StepBar step={props.checking ? 2 : 3} />
                <Text style={styles.title} accessibilityRole="header">
                    {props.checking ? "Checking your photo" : "Your photo was checked"}
                </Text>
                <AgreementChecklist checks={props.checks} ended={!props.checking} />
            </ScrollView>
            {props.checking ? null : (
                <View style={styles.panel}>
                    <Text style={styles.heading} accessibilityRole="alert">
                        {props.message}
                    </Text>
                    {props.agrees ? (
                        <TouchableOpacity
                            style={[styles.button, styles.submit]}
                            onPress={props.onSubmit}
                            disabled={props.submitting}
                            accessibilityRole="button"
                            accessibilityState={{busy: props.submitting}}
                        >
                            {props.submitting ? (
                                <ActivityIndicator size="small" color={perk.limeInk} />
                            ) : (
                                <Text style={styles.submitText}>Submit</Text>
                            )}
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.row}>
                            <TouchableOpacity
                                style={[styles.button, styles.half, styles.secondary]}
                                onPress={props.onDisagree}
                                accessibilityRole="button"
                            >
                                <Text style={styles.secondaryText}>Disagree</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.button, styles.half]}
                                onPress={props.onRetake}
                                accessibilityRole="button"
                            >
                                <CameraIcon size={18} color={perk.lime} />
                                <Text style={styles.buttonText}>Retake photo</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    body: {flex: 1},
    list: {
        paddingHorizontal: 20,
        paddingTop: 4,
        paddingBottom: 20,
        gap: 16,
    },
    title: {
        fontSize: 28,
        lineHeight: 32,
        fontWeight: "900",
        letterSpacing: -0.6,
        color: perk.ink,
    },
    panel: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 16,
        gap: 12,
        backgroundColor: perk.card,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: perk.rule16,
    },
    heading: {
        fontSize: 19,
        fontWeight: "900",
        letterSpacing: -0.3,
        lineHeight: 25,
        color: perk.ink,
    },
    row: {
        flexDirection: "row",
        gap: 12,
    },
    half: {
        flex: 1,
        flexBasis: 0,
    },
    button: {
        flexDirection: "row",
        backgroundColor: perk.ink,
        paddingVertical: 16,
        borderRadius: 999,
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
    },
    buttonText: {
        color: perk.lime,
        fontSize: 15,
        fontWeight: "800",
    },
    submit: {
        backgroundColor: perk.lime,
    },
    submitText: {
        color: perk.limeInk,
        fontSize: 15,
        fontWeight: "800",
    },
    secondary: {
        backgroundColor: perk.surface,
    },
    secondaryText: {
        color: perk.ink,
        fontSize: 15,
        fontWeight: "800",
    },
});
