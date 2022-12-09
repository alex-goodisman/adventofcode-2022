namespace day3 {
  // strings dont have literal lengths (even though they could) so measure by counting up an array
  type lengthOfString<
    S extends string,
    L extends null[] = []
  > = S extends `${infer _}${infer T}`
    ? lengthOfString<T, [null, ...L]>
    : L["length"];

  // remove one character until two equal halves
  type splitInHalf<
    S extends string,
    R extends string = ""
  > = lengthOfString<R> extends lengthOfString<S>
    ? [R, S]
    : S extends `${infer H}${infer T}`
    ? splitInHalf<T, `${R}${H}`>
    : never;

  // find a character in string A that matches single character B
  type contains<
    A extends string,
    B extends string
  > = A extends `${infer H}${infer T}`
    ? H extends B
      ? true
      : contains<T, B>
    : false;

  // find all character in string A that is also in string B (result is a string)
  type findContained<
    A extends string,
    B extends string,
    S extends string = ""
  > = A extends `${infer H}${infer T}`
    ? contains<B, H> extends true
      ? findContained<T, B, `${S}${H}`>
      : findContained<T, B, S>
    : S;

  // split in half then find all duplicates between the halves
  type findDuplicates<A extends string> = splitInHalf<A> extends [
    infer L extends string,
    infer R extends string
  ]
    ? findContained<L, R>
    : never;

  // assert a single duplicate exists
  type findDuplicate<A extends string> =
    findDuplicates<A> extends `${infer H}${infer _}` ? H : never;

  // as far as I know, there's no way to extract charCodes natively (charCodeAt return type is just number)
  // index in this string is the code we want. padded with _ because the desired values are 1-indexed
  type charCodesStr = "_abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

  // compute the 'priority' for character C by iterating through the charCodeStr and counting up an array
  type priority<
    C extends string,
    S extends string = charCodesStr,
    L extends null[] = []
  > = S extends `${infer H}${infer T}`
    ? H extends C
      ? L["length"]
      : priority<C, T, [null, ...L]>
    : never;

  type priorityForString<S extends string> = priority<findDuplicate<S>>;

  type mapPriorityForString<
    S extends string[],
    P extends number[] = []
  > = S extends [infer H extends string, ...infer T extends string[]]
    ? mapPriorityForString<T, [...P, priorityForString<H>]>
    : P;

  // input processing
  type trim<S extends string> = S extends `\n${infer T}`
    ? trim<T>
    : S extends `${infer T}\n`
    ? trim<T>
    : S;

  // read one line. can only do one at a time to avoid getting into max recursion depth
  type readLine<
    S extends string,
    L extends string = ""
  > = S extends `${infer H}${infer T}`
    ? H extends "\n"
      ? [L, T]
      : readLine<T, `${L}${H}`>
    : [L, ""];

  // split into lines
  type splitLines<
    S extends string,
    L extends string[] = []
  > = readLine<S> extends [infer H extends string, infer T extends string]
    ? T extends ""
      ? [...L, H]
      : splitLines<T, [...L, H]>
    : never;

  // this is a copypaste of the string based adder from previous days.
  // this puzzle only requires it ancillarily but it seems silly to keep reimplementing it
  // --begin paste

  // string to num (for use in adding individual digits)
  type parseNum<S extends string> = S extends `${infer N extends number}`
    ? N
    : never;

  // num to array (for adding)
  type ofLength<N extends number, C extends null[] = []> = C["length"] extends N
    ? C
    : ofLength<N, [null, ...C]>;

  // number adder
  type sum<A extends number, B extends number, C extends boolean = false> = [
    ...ofLength<A>,
    ...ofLength<B>,
    ...(C extends true ? [null] : [])
  ]["length"];

  // only call with one- or two-digit numbers - returns [digit, carry]
  type numToDigit<N> = N extends number
    ? `${N}` extends `${infer _}${infer H}${infer T}`
      ? [`${H}${T}`, true]
      : [`${N}`, false]
    : never;

  // add digit strings (1 char each)
  type addDigit<
    A extends string,
    B extends string,
    C extends boolean = false
  > = numToDigit<sum<parseNum<A>, parseNum<B>, C>>;

  // add strings in reverse order:
  type addReversed<
    A extends string,
    B extends string,
    C extends boolean = false,
    P extends string = ""
  > = A extends `${infer HA}${infer TA}`
    ? B extends `${infer HB}${infer TB}`
      ? addDigit<HA, HB, C> extends [
          infer S extends string,
          infer C2 extends boolean
        ]
        ? addReversed<TA, TB, C2, `${P}${S}`>
        : never
      : addDigit<HA, "0", C> extends [
          infer S extends string,
          infer C2 extends boolean
        ]
      ? addReversed<TA, "", C2, `${P}${S}`>
      : never
    : B extends `${infer HB}${infer TB}`
    ? addDigit<"0", HB, C> extends [
        infer S extends string,
        infer C2 extends boolean
      ]
      ? addReversed<"", TB, C2, `${P}${S}`>
      : never
    : C extends true
    ? `${P}1`
    : P;

  // reverse a string
  type reverse<
    S extends string,
    R extends string = ""
  > = S extends `${infer H}${infer T}` ? reverse<T, `${H}${R}`> : R;

  // string adder
  type addStrings<A extends string, B extends string> = reverse<
    addReversed<reverse<A>, reverse<B>>
  >;

  // addition type that works (we are going to be adding four digit numbers together soon and we will need this)
  type addNumbers<A extends number, B extends number> = parseNum<
    addStrings<`${A}`, `${B}`>
  > extends infer P extends number
    ? P
    : never;
  // --end paste

  // sum priorities
  type arraySum<N extends number[], S extends number = 0> = N extends [
    infer H extends number,
    ...infer T extends number[]
  ]
    ? arraySum<T, addNumbers<S, H>>
    : S;

  type data<I extends string> = splitLines<trim<I>>;
  type day3part1<I extends string> = arraySum<mapPriorityForString<data<I>>>;

  // extract first three
  type split3<
    A extends string[],
    R extends string[] = []
  > = R["length"] extends 3
    ? [R, A]
    : A extends [infer H extends string, ...infer T extends string[]]
    ? split3<T, [...R, H]>
    : [R, []];

  // split into groups of 3
  type group3s<
    A extends string[],
    R extends string[][] = []
  > = split3<A> extends [infer H extends string[], infer T extends string[]]
    ? T extends []
      ? [...R, H]
      : group3s<T, [...R, H]>
    : never;

  // find a list of common chars from a list of strings. C is the starting list that will be narrowed down with each
  // element from S
  type findCommons<S extends string[], C extends string> = S extends [
    infer H extends string,
    ...infer T extends string[]
  ]
    ? findCommons<T, findContained<C, H>>
    : C;

  // find a list of common chars from a list of strings. special case handling for if the array has length 0 or 1
  type findCommonsFromArray<S extends string[]> = S extends [
    infer H extends string,
    ...infer T extends string[]
  ]
    ? findCommons<T, H> extends `${infer F}${infer _}`
      ? F
      : never //only care about the first one at the end
    : "";

  // map the commons finding process over an array
  type mapFindCommonsFromArray<
    S extends string[][],
    R extends string[] = []
  > = S extends [infer H extends string[], ...infer T extends string[][]]
    ? mapFindCommonsFromArray<T, [...R, findCommonsFromArray<H>]>
    : R;

  // map the "priority" conversion over an array.
  // this is for an array of characters that are each a priority value
  // the previous mapping of priority (for part 1) was: split in half, then find duplicate, then priority
  type mapPriority<S extends string[], R extends number[] = []> = S extends [
    infer H extends string,
    ...infer T extends string[]
  ]
    ? mapPriority<T, [...R, priority<H>]>
    : R;

  type day3part2<I extends string> = arraySum<
    mapPriority<mapFindCommonsFromArray<group3s<data<I>>>>
  >;

  type input = `
gvNbShZZgQfWdQhdPQmggLTFLwmwjFqjVVgM
CsJnHllcsnnnnJrGRnRwPPLVmFLHLBjFFVHmPT
JlnCtctJnJDcJlDCRpPrSSQWfphzWZfbZSvfNfbS
WjvRSdSQjvpjWzNlnZlNZqCCMzZZ
nJtJsbctPBPwLNcDZNNGLClC
tsFJHBgJwgJbnvSHHWVWHhVhpQ
zRzPhCCSHVZzfGHZ
qBsWBpqBwBcvqqWgdfZrprdggPHHVZ
WWmvwvBbnWmnwvWcbmWWnqNCRSDRRSSjjSDbPJbRjClLhC
rQrznfHHhrHzllzlzTGcJgtJ
jhhjjSZVPWVZvSFtTttLTglgFtvm
dqSCqVWdbDSSVqbVVSqhNdrnpnCnfsnnwfnsRpMpBMrf
rTnvrSSHvHtnDQVDtfmW
ZjCglhcCJschpZbZgbtGmRtbGmwtQtbmtN
FFZCghFJhlslFpjcdFTPLHHmrqTMTdzBLHLH
WzDfrDwwDCCDMnfDHHJjTHTtNdngdHtQ
FmScGPPPPmpspchbGHtRsjdJJJWJWNttgH
bvhFlVhPchPvqWLwqLWqvq
RcchVlCCvmhDRjNJJJjbjllZlJ
wPwFGFMPfpdtqbpwFFfGPQZTWTZjtzQWTBBQJzZjZZ
fbwPqqMPwdgvmDVDhmRCgR
SSQggtQVQQgQGmGVthVnWDGjCBLLzdDNCCjDGWCW
RcHcHbFqbPMZRFTvHFFFlcZZBNBtNjjLLjDdjLjDqWCpNLpj
sPPclZcsZtMPfVsnnwwVJhmQ
jlrwpVPjMwfzZfhfwddH
DbQBGgBJPPBBHfPZ
ggGSQTnTgQGbSRQRPrNlsjVjMrpmMLnrrW
MzNNbMSrZNSSvGWWznwGQlTG
ZCFCJHqJFjqTTqngPwPG
LCJLJCCFtfjsJCMbZSMSbbcDdBfd
LCdjljfJJBfLDCCdJqGqsGGtmBsWtbGmSS
gpgchRcPgRRQNZcpNhgNPzzmGrmrGwtSSswqrSGbbTzt
QgQvNppRPQcggZNccchvNZgCjlnsDLDflDdfjLfMDVsMLv
jfSfTWfwTJffQQNwTCHnGGGgHbgqGFvF
LmspctdsLDlBLPmFFgqbqFFbqlnSRS
PSZZsctsDDtdBmzBLBSmpJjMzWwjVfwJVMrNfwrfzf
zFZqbRNRHNHhqHFqzNnzzqDQVFMggMgDpmJMTgpVTQFJ
SwLVsSWBfStDGMfDTDGGGT
vlCBVsSvCRrHRjCqrn
ndGVddlVdrcGlGcljdVGjCgfffPCCLfCMvqWvPnqgn
FNtRZBDDSNSNStDhFRNQtLgCMTCBqvLMMTfJqBLPLP
bwQwZhSDFhZbFSNccwzwHmHHjHMwsd
BrSDgqrgWzWDwJBzMDWBLjpmVLFfFPLVJjVVPLFV
cNnRlvNRvQTcnZwmfQGPmfVFPP
dsCNllvTdnntTlTsHcdCRtNRBDWBDWDrWBhDBqMBDqbzWwCr
stLcchcTwRcsVTtftVVthchqmmCCFvWmmgSgQFCwGvWSFCrr
PljDbZbzjllHdQNWHMFGrMMHMFrmmM
njjjzbPdqRcRQQns
BTBLwzmqWNbpzqNzLppLBnhZJcJSHThhnnJZHHSQnr
RfQgDjgsjVfRFDdvddtvhhhJCnrSnMZCcMSCSJ
QRtjtRQQlzlqqzzzBW
FnzllplJMntnzptLFzsjTVSQcSjSjQFFmdQQ
wgwrBrwGHPGBqHrDcpmjddSQTmTGVmmG
DBhhNBrCrMvNvzptpN
LgSbLLRJQSzLCgJRJhWCCzRBdZdcMfcHsMdFFjfPjsCHBc
nrVTnmrrrlnGGmrlVwVZPFHmdsZHBmjMcdjfcZ
wrnTlNpvVVrqFrtnwGqwwrTpSgSQQLbQRzQSQRJbQpDbQz
pgvmcpVcpwJppwgwvMWfHbRGRHDBJbWGfGGb
hQqFqQNhqdCPNhTQCCFbbjmBHBbBRjGHBDBGFj
TtdCCNlPCmssnqgvzzvvtVrgzzrc
JltddTSgtLLvgvdldgvWPZPPSjWMjCfWNjNWPG
FrwpbwhbmfjGRpGPNM
cmBrBcBnmFBQqcFbscBhQfttznJgzlLLDlnglzLLlg
mDhRsDzWZzGhhhWpZwzwGdfbFsfFTQTLcNFfFrNvvcbT
ngMHjjgVgqHnPlnqtnClMHbfCJFbcLFFJFLbrQNbFQcQ
SlqHqVVqPnBHSHHljlMndBdZQphRhdGpzWmWWwBh
hVNhcfbSSNMfjjMlqRCqpdzpRJdnhl
sBHPPwQwttBBssLCHzDBlDDmRmpJdqJJJd
sHHwtsHTWwtZPHtZbbVSgMbGCNjNvN
SgMtSMVChFBHBFdCwhdqPcPsbRVQqsblDbRmlc
jlrLWfvWvzWWzmcQcqcNbmNDjR
JpLznrnfGrrfnWWzTpfvzvdHHCgSBwdlTMhCTMFhBBwg
fptnFPLsttddDdRhQShQzC
BqGHGlqmmGmlJmNmqlbbCzSCQHDzSjHhfSShjfVh
fbrrMqGGBlNMGNqrqglmrLZwFcwgFwsPcscctpWLgn
TCMMTtWBqCMMMWWMSWhNFhlNBNlNHwNDsvhw
frfdrbZJrVLdZLbnJcrmvhlhHshlgsZsHwwghZ
fLRVvcvRVpfbcfVVJTqpWCCSqCCTTtjjPj
vRCGzdTtvdBCTzCdmVsQjnVttngthgnQHs
rLNZlrwrjrFLMsggsQpsQngqMq
NfjZWcbffDrLZfNLbDczvmcTvvGCmCBBmSdP
DSqdzrHgJtSHMgvmnNGdcmCnvssN
ZwQLlVlRVVWZFZhbJZVjRJscvBGcpssLpBcnGpBsmpBs
TwwjjQJTjlhwMfTDgMrfgtqg
HhvVhgddvdvqTqVqHQgjgmCPWGrcWsGWPcvlsWrWmC
lbJBBFbMlJFRCmsRmRPtCtwm
FMLLpDLnFpFJbDfLnZZSzhqHVdVQjgSdlQTZ
mvBrszzsrrrGsBDvBvszDRQDhjCwWdLhJdCjjWZdqqdZdW
gMlfFVccTGMGPMSCdcLLdqhjLJWWdZ
VfggggPVltVSlSlHfgFtTpfRGmRrrrvQpQsrGmnvnQbzmz
HjtMgWbHBtbtcggVcHwMwcdzpZFGzGZFpvFFZZWnnpFG
RNNrfmSrSSzdGBzFfJFq
mNsSrrTPPRshmsBClRClPmSccVgQVHjHwtHwTMbTVwMHgg
pZmmLpQLDJBCPCssJTsCTc
SwlLwWvSwNSSSMSMfWLvvVdPFzjfTscdjcCsjzCPddFc
vbVMqGbLSVMhDQnRRQnBqH
lNmNwlmlbhhfFNgpJLnHfTHfTdnTML
BGvCwVGVPSDWDMMJTHZMpndH
rVcBrPSPCwWqPwGCBCSrqlNNQFhsQhtlhhhgNQtb
HqZCQRQgWjpmZHRHqQjttGGJQNQtwQGGGbGrJz
SlddfFVMLncbJJMzMzzMwD
ndSznsdVHsqgpZvH
sNStMtNtDztrvrRGPRRRRrNzqcchgJJLqnBScBcJThJggJBT
QCWWZbCbCVjVbFVFbVwbnhqLqhghBLwwTqJJcpgTBL
ZlHjfHHFWFjCdbHlQFnfdnZFMzPzrrlMrtrrGRMsDPrGvGPz
NnDHhNNldhNTdHllpptCRtftzmGBGmVRVGRH
wgZgZJLBwqgLSWrBvZVVzmffWzRmGsGmmssm
bgqPBBLbPbrrZBjjlpjccjDdDchFTNlc
WRWNNRWNfLZtsmtSWrtLmWgTcMcPrpMTcVMMPPBBqjcg
QJJDFbpnpJdlcwcgBTqlgPwc
GJFHJGhHnpWWShpsRS
DHDZvDQWdHJMHlJf
RhhnGLnBtGrnLjwwJTTMTdQccllSMQ
rmFrrBGQLQFLjbFnBhQLhrRGCPVDWzgmpsWvWWDzppWpzCvC
bsrJrWgWJvQRqbbRDNGGZDlwNfNfwS
ttCHThhhcBVpTBcdhdpfNGDSQLwDLfDGfQllCG
jFjzcFhzQTTjHFvJsrPPnnFgPb
SZggDgNLGCQzSgRsljscPvPPbHsBNc
TtFfTpMthzhFFTpdMMJPfjPPWjBbHbjPlPPBjj
dpdttMMTJttzMFhqFwGLgGRSrrQGSZrwRrDQ
JsJntWmghjgJTpfgFCczlztzrDZDtDzC
QddBBdBSPPPHBSVHVHvNdPVRClvlcclCDLCLFRFrrDLcZc
NVwBVSNlSBNHngnngsJWhwWh
hQVWJGWJlJQDGJHQWHpVWJVHmfPGPcjfdLdLSrcCmfjPjCPm
wgwnRwMvNvBvFZMngNvFZCjdSSfcbPLjCbcdCbSf
wgnRvMMvjMsTwngTgnnDVDWJDplHWhlhQWlWDT
WGswWFGsBFwHvjnbnnJjbG
gLDrSrPpLfmmDqqbbJZsjvmvRv
DTldTpTsDLgSsLpfPTslVdVVdNWVzcNwtWdWhzVt
sttWrhWZsLVtJVZrWhgbCPQQbDNVCHglnnlN
vvRRRMqpmTjwFqmfjFjmBMwNbCwQNgHgDnbNnHQHQCDg
THpvmBGfzWGzSzzS
nmZwwfPmNggwgPgNmdvPPhTRHTHBJTsvSP
WDccMzVQzGWcrllLdsGTvTsJJBLTdL
pWtzQrzDlrCpcQztlzCCCpCVFFFwtgmfbjmbqwZjZfmFwfdw
bmMNNMVSRWBWCSmVRdMRmMnvZZscvvszGcnZClpcGsvZ
gfLfDDtDgjgDtWTjFQjHsvvpZqqplfvvcllcnnvG
TFPjDtWPNPwBBBNB
QcTCHcTwdpQgcWzWwvMPRzSGwW
sDNjfhVmnlVffmLNfLbMPPDbqGtMSRWtDMtP
fZjJJshhhLNnrCJScHSccTQQ
qfhBhLLjvMqWWBWjsQGrdrGzpszpGrqd
JTSDHFtlTDbHTcFcDbTHzmrNRdRRbNzrmRRnRpnQ
PHcltTgJDlplgptScCfCgWMVfvfZvhMMBV
rttDPglHZZDDDPHgZtgWBswdsTfpfdplLqfsFfFdfd
cRVvpcmpmRSCGGCcMQmQFqNNqdVdqTbLwNbdFfFs
zhGjRhSvcMtnrpZjHZBg
STNrrzVdTJwsBggwFgBN
WbtMWJJpwpDsLBfP
cbvncCCmWtCGMcZHVVSlJVQrzvzVqQ
MtPVBHVbBBTwbvWgRgvF
LhZjZpnnMRwWfhSh
LQcQCLCCCcnmnqZpcrpnrjQlsBMHddtMGGzrJHPPsHsNPPJz
NbZtmZDmNNDBHBhDNtNGcvpmgLmmFrvprgrFGv
djMjffMdqnVVTdMfTPnQSFScFFVSLLFrvccvcllL
PPdPwMQwTMWDwBDZLHZN
DqpJFdhtmdSwpqSncljHsnfjqlbzlc
rQVZLGMWPCNrCGMwNVMcbzsVgfHHgfncfscssH
NBCrPLwMTrrMBLQLwCFhpFBDFdFFtdvDFvpD
QRwGBdGwqRTBMWRMMzBqQHHhngspPFFbHbzgbhZLLP
rCNmDjvrCFpvLZsgPb
lDrmpcfCtVDtCjlfNfQQqVdJBQWRVVRMMMJQ
zcgjlRcJCFtlnTvppn
BLSHDMVPVPHVHwFwMhTvgnFZMh
DsLSDdmPVNVdGgrzCCdbjc
tjjRbNQtvJVVsvqsvdTsGqBp
wlFLPZPzzzrzwZPmZfZPlrmpLDCpWDWCSTCpppDDBssdWG
rwwcFFghFmgTcNRJNnnNJtHV
RLhbzMhccqLzdjghdFddNWPN
DmsTZfvrfJLPPWwrdFgw
LsmDtQDfLLGbGQbSzcpM
qwhmmHlHmlwChcCWlpPCBzjPVdBzLsdLBVsT
DnJDMqRDsPsjRVQR
tSGSnNNSbrJJGfDSSfbchpvptFwmpcvlHqZlcF
rdQdBRPrQBBnfdBbzLLgLgmbzSLCPW
TcRTcFDTcjvswMWzzgLSzwwSLJbL
MNTRMNGTsFMMqqqcMDTTnfpBhQhNpHZBZHBfrptQ
ZZFwcQGwRGLTGLTl
rJtMrqBVvhBCnlCn
WWWMttbqqzfPWqWJVzmDQwFQlwZwjQfjgFcZ
RhgmdBbLLmRvhGZwhZZJDwGq
ldPpTtTPtVPpfTGzJQFGFqJsFG
MPpCnrlCVfPtrPVtntllnbdHSbnBvvgdgHgnWvSv
nbnfjQbQZBqBvjQdVFGHhsQhsFsFzGpD
RSJSTTcCVTTMlSNcSTRRwTccpwDFDDzFhHhtwppssFGGpsDp
clcTNJlLMgrcgRvBjfWVfWfBrrZn
LHQdpQLQDRcDBQccVQpnNRhllzMtRqzRztTNnt
mrvZPZvZvZbPSFJrSrggFvrJzbhlzttTlNtqtsMtTntntdqq
GPfJPJwfZFrmFvrPmgHHQLQWdHQBwWWCHVVC
TvTTLfflhZmwZLvtJmhdFhMpnWrpnbJcWMnpHzMrzbcn
VqRRNGCBjRmqPGqDzbHMcMccWnzngHnP
jNqNBjsDsDRCNVsmBRNQNRSSSddhZvLhddZhvhwvLTZwhSfT
vjpJvpgpNwjDWvvJLhFLLhNRTmPTRPRF
HHbHVrMHMmqzHlGmtGqMtdLCLQthQQPCSPTSFLLPRT
bZZzbHszMrqzGmrHMBzbHbqJjffcDgwWjDJpnjjcscwgnw
fBHDMNhhHMrBDBrfQqfwwvvLvfjLZZ
lmppmGJgPPpddJVdnwsQjLttqtjZTpcsvT
RndRmlGWJgdRnWQJQgWdQPlFFbhhbFbHbHMhhBbRDRFrrS
tVhwlMdMWlhlZMZMlzWrtRpBNpLPpmnmCPQBLppPPPBz
GvGTsgjcTLRQHmTQ
gGRGbfbgbcSbbcRggvfcwlZVhVMfltddVtrlZdhW
PwjPHwWssqrHqCqprpCPjwrrQnnDbdnQnGQHnbZbGQZbBQdD
WvNtLhfLndnBNbJJ
fvhvvWfTmtzTmjpsVVqsPzMjjq
GjHMMTMfZbnqHnJNCN
rlpQpthdlQbnlJqRzqVL
spphwcpBvcvdvFTqPDFfwwPZTG
mQfqmtpfBHJCHdlMDB
cbbPPsZqjqcSvVsCrDllsrdzrzzD
TSbVTvShqnVjPTPbggSPbNFQWGtfNLtFfWgGmGgGWR
HJtwgJJwJrcjRRjRnwhVdrVbmGhPmNNrGhdV
fWFvTDssTDMCBCWsvszWWMCQhZhLLNvNNbhVGGZdRZRdmhmd
zCTBzWzDDCDCfFCRqCJHcJJctjJSgHpqHqJg
dgnwgbcwVGbgDWnQbjdgDnBRBBNNqRLBNMLFRMRlqNsc
fTZHmTmzJMmSSCZChZvZTHRlBNBFqtqftlqssqNqftts
JTHJvhzCHpmPCSSTzPpPzJHgQVdQQjQdQwjgdpgdDMGgQM
qPGmWLJWBRRdvqvvNq
TnZHsTZsZsZZbDtbrNrdnDft
SShhQQZCHQCSTVlllVVQCjQWNJGFWpWgFpmmVmNgLgFpGw
TsSmttWMVstNfbMfBcpnFchFwFwZNrrwFp
DWWCGlHWdhddwpcrjh
gQvPqglRCHCHCPCPCJbbtSVVWtTVVJvTbs
ddHSZQHDStZStLtsdDpbCbBPcjGGCqCMBGdNPb
hWhvmglVznzglgzvzfznwfnfscswPjbMBMjNGBMPGMcjcPwP
sJWsJfVflWsnhrltrZLFDDRRFTSSLT
qqCqLNjnPPLZPjqnDjLNgnNrcGwtgddGrhprBJhhJtBGJG
lTMDsDHmlRRbQQbVfMHFmMBJhwcTddrcpBBGdGGJcJdB
lHFfQFssFFFMQRVWQVlssLnDSLLPvZZPqWCLWSqjvS
pJPZRpQtpPQpGPqWbqlWTdLVLJbT
nnnjCwgrgcCFBfnggBCsMTVbVsWVWdCTTdbb
cfhcnwnrcggrncrwcjBDcGHmNPRRGRZZQRRdDZzmzH
NqTrrzLpTNdLLJBBcBGGZGpFHB
sWbgfHSfSgVgZcmGtStZwBFG
VjQjjPjhbbfsCbbDQCgsDrRhzMdlNzHTRdRhqdNTrq
GlqfPdvdBqPgfqDgFMsMVDppbsNJNpMs
WnmmWCTCjZnmzRjTZRRnFBMNpbZZpFJMSFSNFSbS
TRRrnLBmzjttRRCmTRjjwLlvdhQvdrhqqlGdPqGggPlQ
McjMPgPgGPHJWjhPNgPqQbpQSfqffnWVnnnpnZ
BwwDmBTLRBBLzBTBTvtVqlfpqfbQqpqZbnQFlt
rDsDBsmvRTBRzCTZsTmCsCrLPgNcPHNhPccNHHrjMNrgdNdP
GqmLFDrcglvQGZwwzj
nlHbSNBhhslJfsBfvdZHdCvRzdCzppzR
JWShMfWMMthSJBBthJsgtcTTcFqcTrmTLrrTlr
CsBsShBWsBWhvFJWCSsJpbTZdTbdBRgHffRlHHHBgH
tqmnwwwDmVwfzZblzTRqzQ
DGtDjGMcntMGnnGhhjJJJsCpFRRSJJ
GQVVcGgFGcSFvfcFfJVnQmdbTwMLwTTnbnQMws
ZqZrDWDtNPPHRNPzGCdndLLMLwMWhwbmLddn
DRqRHCHlCtDrqtNqDplfpvGFjVjvBSFFcj
zfSfdGPdMVHHdcMThhpwqqrwrqJhcF
vlDNTWDDWWnngNQZtgwLrJZqLFZLFJpFJjJJ
NCtWmnvBmDnWQVTmTGSRmmRTPz
LLvppVLDsppGMGCLCCwNmJMNrNHrNmNNmHFjrh
lZZfvfgRPZQWNNmlWlFNHl
nnRtndRbcPttvTpswLTs
trtzWfszNPlhPlgrWglhZjSLDBvTfSDTmSvmLvfS
QMdVVGBQMTJDvSjdHJ
nBppGVVnQQgzgPsPzzhp
fVQzVrQVtVzHwjtMTjcTCjFgcDCGCd
JslDPWLbLbZlJBMgBTBPdcFTFd
JNJmZsDLnLDWmsVqSrHqnHqQwQSq
mLMZRMRmZLmHLLjNshrrJjRsNNsj
PnqnBVBPcpWrWfWzDhDsHW
qpBQgcQncqpBcVgtclHqcSMTLZZQvLLZdLdwCmLMSd
PZgMwZMjPgBCWgZFgmBGSTtwcccztTzbnGDcNT
vJLlvvlfdsVVslVHrrpLfRlDcSScmbSnnRGDnbDTSbSSDt
fvVHdLfLQljmmqqMQPhQ
DZRstNGrDWGRMlzLHLMpNSpp
bPgCrCvgnrCPgwplbMSjfHzHfj
CgnFnBVrFFVmdVggmPPVTTcZBGhRqGtcZqqJhGRGssWs
WrrCGrDlWhBBZtHB
ggdcnQpcPRSpzfvJBTfPJvtP
gSNnSBFnSMBNjpMssDmCrrGmCLqq
szZGZGGwNdVtpwvbzptzVBQQLFclTJQFlHJNcFBRRJ
CTrqSfWThWDjJCcLQRRRFLlQ
rggqfMqPWnDqnVbZvTtPZpssVw
GJHqPPcJnhthNHnL
rzzlVDVTQDzSSdsSlzpBspssLhmZNjhZWjjffWBLZhgBmnjt
TSTQTsnTbDsMvCGwcFvbJR
PPjtzdnCnSjSthPjWJgJWjgMNBsNrT
bZHfLLhvhpbfvLhHfQbqpNJTWWNsqNTrTNrgWN
ZFbZZFvlRvZwhQwLDSdGnmCGmnlmdznD
RFRRhzzsRsszRlhbrhgBcbTfHgBT
pJtNmSgwZNtSJLgSqHcbBDDTHPfrSqTc
ZNWdpNCJtLZpQJLLpmLtZNFGjVgFnsngRGllVsjjCnvs
sJVRJmmmwwlmzcszMzjRjJVzspCZBsZTTFpTTZvSZTFBFbtZ
GhNDgNWnGGqDvFSCZvbtFpvg
fWrCNNffGnhWdrPhWjwjzRlJmcjRcPzlmV
FdncmqmgcZztLWFvFFvjWLlT
RsMMJVpfhJVsDVMfJpvlTWTvhjQSQvCbLCSC
jDBjRrsVfNJgzdZrZwtmZt
THDDQLZTGQQLQDSSTBCZSZHfFrvvlVRRlPVFfVrvqnvnnH
VbWWcgbNpjgPrRvrNfqnzv
swggwpJWwsWscJsDSLTJTmSVZJTBDZ
wGsznPGGBHdzHhtHDD
WMVSWqVmrSBMpvWVMFtdClhDtqDDHhdtQt
RgWVRcmgnPPnjJBg
BmfPBHBFswLLjQQnLCnzzW
SRdvvRSGrdlRSvTgRrMVCjVWCZzMnVZhWzTj
vlSRJrRJvbGGrSSJgWvlScptFmwbmfHHBfsNFmBbfsFm
`;

  type ouptut = [day3part1<input>, day3part2<input>];
}
