import Foundation

enum Copy {
    private static func localized(_ key: String.LocalizationValue) -> String {
        String(localized: key, locale: AppLocale.current.locale)
    }

    private static func formatted(_ key: String.LocalizationValue, _ arguments: CVarArg...) -> String {
        String(
            format: localized(key), locale: AppLocale.current.locale,
            arguments: arguments)
    }

    static var votesTab: String { localized("copy.votesTab") }
    static var membersTab: String { localized("copy.membersTab") }
    static var partiesTab: String { localized("copy.partiesTab") }
    static var moreTab: String { localized("copy.moreTab") }

    static var yes: String { localized("copy.yes") }
    static var no: String { localized("copy.no") }
    static var abstain: String { localized("copy.abstain") }
    static var absent: String { localized("copy.absent") }
    static var accepted: String { localized("copy.accepted") }
    static var rejected: String { localized("copy.rejected") }
    static var positionYes: String { localized("copy.positionYes") }
    static var positionNo: String { localized("copy.positionNo") }
    static var positionAbstain: String { localized("copy.positionAbstain") }
    static var positionMixed: String { localized("copy.positionMixed") }

    static var unknown: String { localized("copy.unknown") }
    static var government: String { localized("copy.government") }
    static var resultSection: String { localized("copy.resultSection") }
    static var debateSection: String { localized("copy.debateSection") }
    static var defectorsSection: String { localized("copy.defectorsSection") }
    static var motionPdf: String { localized("copy.motionPdf") }
    static var majority: String { localized("copy.majority") }

    static var searchMembers: String { localized("copy.searchMembers") }
    static var attendance: String { localized("copy.attendance") }
    static var loyalty: String { localized("copy.loyalty") }
    static var line: String { localized("copy.line") }
    static var deviation: String { localized("copy.deviation") }
    static var votesSection: String { localized("copy.votesSection") }
    static var speechesSection: String { localized("copy.speechesSection") }

    static var seats: String { localized("copy.seats") }
    static var cohesion: String { localized("copy.cohesion") }
    static var donationsSection: String { localized("copy.donationsSection") }
    static var alignmentsSection: String { localized("copy.alignmentsSection") }
    static var electoralTerm: String { localized("copy.electoralTerm") }
    static var share: String { localized("copy.share") }

    static var motionTitle: String { localized("copy.motionTitle") }
    static var billTitle: String { localized("copy.billTitle") }
    static var introducedLabel: String { localized("copy.introducedLabel") }
    static var drucksacheLabel: String { localized("copy.drucksacheLabel") }
    static var dipSource: String { localized("copy.dipSource") }

    static var website: String { localized("copy.website") }
    static var imprint: String { localized("copy.imprint") }
    static var privacy: String { localized("copy.privacy") }
    static var fontLicense: String { localized("copy.fontLicense") }
    static var refreshSection: String { localized("copy.refreshSection") }
    static var lastRefresh: String { localized("copy.lastRefresh") }
    static var never: String { localized("copy.never") }
    static var aiNotice: String { localized("copy.aiNotice") }

    static var languageSection: String { localized("copy.languageSection") }
    static var languageSystem: String { localized("copy.languageSystem") }
    static var languageGerman: String { localized("copy.languageGerman") }
    static var languageEnglish: String { localized("copy.languageEnglish") }
    static var projectSection: String { localized("copy.projectSection") }
    static var moreTagline: String { localized("copy.moreTagline") }
    static var moreDescription: String { localized("copy.moreDescription") }
    static var aboutData: String { localized("copy.aboutData") }
    static var questions: String { localized("copy.questions") }
    static var feedback: String { localized("copy.feedback") }
    static var contribute: String { localized("copy.contribute") }
    static var shareMachtblick: String { localized("copy.shareMachtblick") }
    static var shareMessage: String { localized("copy.shareMessage") }
    static var legalSection: String { localized("copy.legalSection") }
    static var privacyStatement: String { localized("copy.privacyStatement") }
    static var questionsSubject: String { localized("copy.questionsSubject") }
    static var feedbackSubject: String { localized("copy.feedbackSubject") }
    static var contributeSubject: String { localized("copy.contributeSubject") }

    static var tabResult: String { localized("copy.tabResult") }
    static var tabDetails: String { localized("copy.tabDetails") }
    static var tabSpeeches: String { localized("copy.tabSpeeches") }
    static var officialTitle: String { localized("copy.officialTitle") }
    static var officialDataNotice: String { localized("copy.officialDataNotice") }
    static var officialDataLink: String { localized("copy.officialDataLink") }
    static var aiSummaryNotice: String { localized("copy.aiSummaryNotice") }
    static var fullMotion: String { localized("copy.fullMotion") }
    static var invertedNotice: String { localized("copy.invertedNotice") }
    static var petitionNotice: String { localized("copy.petitionNotice") }

    static var partySummariesTitle: String { localized("copy.partySummariesTitle") }
    static var debateTimeline: String { localized("copy.debateTimeline") }
    static var readFullSpeech: String { localized("copy.readFullSpeech") }
    static var searchSpeeches: String { localized("copy.searchSpeeches") }
    static var noSpeechesFound: String { localized("copy.noSpeechesFound") }
    static var translationFallbackNotice: String { localized("copy.translationFallbackNotice") }
    static var zwischenfrage: String { localized("copy.zwischenfrage") }
    static var showMore: String { localized("copy.showMore") }
    static var close: String { localized("copy.close") }
    static var previousLabel: String { localized("copy.previousLabel") }
    static var nextLabel: String { localized("copy.nextLabel") }

    static var filterLabel: String { localized("copy.filterLabel") }
    static var filterType: String { localized("copy.filterType") }
    static var filterProposer: String { localized("copy.filterProposer") }
    static var filterCategory: String { localized("copy.filterCategory") }
    static var namedVote: String { localized("copy.namedVote") }
    static var showOfHands: String { localized("copy.showOfHands") }
    static var noResults: String { localized("copy.noResults") }
    static var loadError: String { localized("copy.loadError") }
    static var retry: String { localized("copy.retry") }
    static var filterAll: String { localized("copy.filterAll") }
    static var flagFilter: String { localized("copy.flagFilter") }
    static var flagSaved: String { localized("copy.flagSaved") }
    static var flagSeen: String { localized("copy.flagSeen") }
    static var flagUnseen: String { localized("copy.flagUnseen") }
    static var saveVote: String { localized("copy.saveVote") }
    static var removeSavedVote: String { localized("copy.removeSavedVote") }
    static var markVoteSeen: String { localized("copy.markVoteSeen") }
    static var markVoteUnseen: String { localized("copy.markVoteUnseen") }
    static var shareAction: String { localized("copy.shareAction") }

    static var filterFaction: String { localized("copy.filterFaction") }
    static var filterState: String { localized("copy.filterState") }
    static var filterSex: String { localized("copy.filterSex") }
    static var filterAge: String { localized("copy.filterAge") }
    static var filterMandate: String { localized("copy.filterMandate") }
    static var sexMale: String { localized("copy.sexMale") }
    static var sexFemale: String { localized("copy.sexFemale") }
    static var sexDivers: String { localized("copy.sexDivers") }
    static var mandateDirekt: String { localized("copy.mandateDirekt") }
    static var mandateListe: String { localized("copy.mandateListe") }
    static var ageUnder30: String { localized("copy.ageUnder30") }
    static var age30: String { localized("copy.age30") }
    static var age40: String { localized("copy.age40") }
    static var age50: String { localized("copy.age50") }
    static var age60: String { localized("copy.age60") }
    static var age70: String { localized("copy.age70") }
    static var sortLabel: String { localized("copy.sortLabel") }
    static var sortName: String { localized("copy.sortName") }
    static var ascending: String { localized("copy.ascending") }
    static var descending: String { localized("copy.descending") }
    static var noMembersFound: String { localized("copy.noMembersFound") }
    static var demographicsFaction: String { localized("copy.demographicsFaction") }
    static var noData: String { localized("copy.noData") }

    static var noVoteData: String { localized("copy.noVoteData") }
    static var noPartyLine: String { localized("copy.noPartyLine") }
    static var photoAttribution: String { localized("copy.photoAttribution") }
    static var photoSource: String { localized("copy.photoSource") }
    static var tabMotions: String { localized("copy.tabMotions") }
    static var voteLabel: String { localized("copy.voteLabel") }
    static var notCast: String { localized("copy.notCast") }
    static var deviatedFromLine: String { localized("copy.deviatedFromLine") }
    static var viewFullDebate: String { localized("copy.viewFullDebate") }

    static var govLabel: String { localized("copy.govLabel") }
    static var greensLabel: String { localized("copy.greensLabel") }
    static var leftLabel: String { localized("copy.leftLabel") }
    static var oppositionLabel: String { localized("copy.oppositionLabel") }
    static var fraktionslosLabel: String { localized("copy.fraktionslosLabel") }
    static var petitionsCommitteeLabel: String { localized("copy.petitionsCommitteeLabel") }
    static var electionReviewCommitteeLabel: String { localized("copy.electionReviewCommitteeLabel") }
    static var acceptedCountSuffix: String { localized("copy.acceptedCountSuffix") }
    static var partyLineLabel: String { localized("copy.partyLineLabel") }
    static var shareOfBundestag: String { localized("copy.shareOfBundestag") }
    static var sinceToday: String { localized("copy.sinceToday") }

    static var verfahren: String { localized("copy.verfahren") }
    static var stageCommittee: String { localized("copy.stageCommittee") }
    static var stageVote: String { localized("copy.stageVote") }
    static var stageEnacted: String { localized("copy.stageEnacted") }
    static var laenderMotion: String { localized("copy.laenderMotion") }
    static var broughtBy: String { localized("copy.broughtBy") }
    static var proposalSummary: String { localized("copy.proposalSummary") }
    static var officialTitleMotion: String { localized("copy.officialTitleMotion") }
    static var stampUeberwiesen: String { localized("copy.stampUeberwiesen") }
    static var stampBeschlussempfehlung: String { localized("copy.stampBeschlussempfehlung") }
    static var stampNichtBeraten: String { localized("copy.stampNichtBeraten") }

    static func languageName(_ locale: AppLocale) -> String {
        locale == .de ? languageGerman : languageEnglish
    }

    static func languageSelectionName(_ language: AppLanguage) -> String {
        switch language {
        case .system: return languageSystem
        case .de: return languageGerman
        case .en: return languageEnglish
        }
    }

    static func partyHistoryEvent(_ labelDe: String) -> String {
        switch labelDe {
        case "Abspaltung BSW":
            return localized("copy.partyHistoryEvent.bswSplit")
        case "Abspaltung von Die Linke":
            return localized("copy.partyHistoryEvent.leftSplit")
        case "Fusion mit Bündnis 90 zu Bündnis 90/Die Grünen":
            return localized("copy.partyHistoryEvent.greensMerger")
        case "Fusion mit WASG zu Die Linke":
            return localized("copy.partyHistoryEvent.wasgMerger")
        case "Gründung AfD":
            return localized("copy.partyHistoryEvent.afdFounded")
        case "Gründung Die Grünen":
            return localized("copy.partyHistoryEvent.greensFounded")
        case "KPD-Verbot durch Bundesverfassungsgericht":
            return localized("copy.partyHistoryEvent.kpdBan")
        case "Umbenennung SED-PDS zu PDS":
            return localized("copy.partyHistoryEvent.sedPdsRename")
        default:
            return labelDe
        }
    }

    static func systemLanguageHint(_ locale: AppLocale) -> String {
        formatted("format.systemLanguageHint", languageName(locale))
    }

    static func versionLabel(version: String, build: String) -> String {
        formatted("format.versionLabel", version, build)
    }

    static func feedbackBody(
        version: String, build: String, selection: AppLanguage, resolved: AppLocale,
        iOSVersion: String
    ) -> String {
        formatted(
            "format.feedbackBody", version, build, languageSelectionName(selection),
            languageName(resolved), iOSVersion)
    }

    static func voteCount(_ count: Int) -> String {
        formatted(count == 1 ? "format.voteCount.one" : "format.voteCount.other", Int64(count))
    }

    static func seatCount(_ count: Int) -> String {
        formatted(count == 1 ? "format.seatCount.one" : "format.seatCount.other", Int64(count))
    }

    static func missedVotes(_ count: Int, total: Int) -> String {
        formatted("format.missedVotes", Int64(count), Int64(total))
    }

    static func deviationCount(_ count: Int) -> String {
        formatted(
            count == 1 ? "format.deviationCount.one" : "format.deviationCount.other",
            Int64(count))
    }

    static func sharedVotesAgreement(_ percentage: String, count: Int) -> String {
        formatted(
            count == 1 ? "format.sharedVotesAgreement.one" : "format.sharedVotesAgreement.other",
            percentage, Int64(count))
    }

    static func memberAge(_ age: Int) -> String {
        formatted("format.memberAge", Int64(age))
    }

    static func constituencyLabel(_ name: String) -> String {
        formatted("format.constituency", name)
    }

    static func photoCredit(author: String, license: String) -> String {
        formatted("format.photoCredit", author, license)
    }

    static func governmentSeats(_ count: Int, total: Int) -> String {
        formatted("format.governmentSeats", Int64(count), Int64(total))
    }

    static func oppositionSeats(_ count: Int) -> String {
        formatted(
            count == 1 ? "format.oppositionSeats.one" : "format.oppositionSeats.other",
            Int64(count))
    }

    static func unaffiliatedSeats(_ count: Int) -> String {
        formatted(
            count == 1 ? "format.unaffiliatedSeats.one" : "format.unaffiliatedSeats.other",
            Int64(count))
    }
}
