namespace day7 {
  // in retrospect, I should have added all the files together when finding them.
  // I didn't know, working on part 1, that it would be safe to do that. I thought
  // we might need the file names or something. Oh well. If I were to reimplement, I'd do that.

  // read one line, return [line, remainder]
  type readLine<
    S extends string,
    C extends string = ""
  > = S extends `${infer H}${infer T}`
    ? H extends "\n"
      ? [C, T]
      : readLine<T, `${C}${H}`>
    : [C, S];

  // read 50 lines or whole string. return [lines, remainder]
  type readChunk<
    S extends string,
    C extends string[] = []
  > = C["length"] extends 50
    ? [C, S]
    : S extends ""
    ? [C, S]
    : readLine<S> extends [infer L extends string, infer R extends string]
    ? readChunk<R, [...C, L]>
    : never;

  // read into chunks. return array of chunks. each chunk is 50 lines unless it's the last one.
  type splitChunks<S extends string, C extends string[][] = []> = S extends ""
    ? C
    : readChunk<S> extends [infer K extends string[], infer R extends string]
    ? splitChunks<R, [...C, K]>
    : never;

  // process a chunk of commands to filesystem data. this is a 1 to 1 transformation, ish (ls are omitted)
  // P is CWD, R is output. Every cd commands become a string[] containing the full path at that point (making it context free)
  // every file listing becomes a [string, number] with name, size. size is 0 for directories.
  type transformChunk<
    S extends string[],
    P extends string[] = [],
    R extends (string[] | [string, number])[] = []
  > = S extends [infer H extends string, ...infer T extends string[]]
    ? H extends "$ ls"
      ? transformChunk<T, P, R> //skip any ls command, since they don't say anything
      : H extends "$ cd /"
      ? transformChunk<T, [], [...R, []]> //cd root resets CWD and adds an empty array to the output.
      : H extends "$ cd .." //cd up moves up CWD and adds the new CWD to the output.
      ? P extends [...infer Q extends string[], infer _]
        ? transformChunk<T, Q, [...R, Q]>
        : transformChunk<T, [], [...R, []]> //if we're already at root, stay at root
      : H extends `$ cd ${infer D}` //cd X adds CWD+X to the output and sets new CWD
      ? transformChunk<T, [...P, D], [...R, [...P, D]]>
      : H extends `dir ${infer D}` //directory listing, add to output
      ? transformChunk<T, P, [...R, [D, 0]]>
      : H extends `${infer N extends number} ${infer F}` //file listing, add to output
      ? transformChunk<T, P, [...R, [F, N]]>
      : transformChunk<T, P, R> //unknown line, skip
    : [P, R]; //at the end, return the CWD and the output data.

  // We can simplify significantly. Two files in a row can become a single object (array with two entries) since those files will always be treated together.
  // since the CWD instructions are now context free, when there are two in a row we can discard the second one. This simplifies until we have a pattern of:
  // go to directory, array of all files, go to directory, array of all files, etc. Processes the output of transformChunk on a SINGLE chunk.
  type collapse<
    A extends (string[] | [string, number] | [string, number][])[],
    B extends (string[] | [string, number][])[] = []
  > = A extends [
    infer F extends string[] | [string, number] | [string, number][],
    infer S extends string[] | [string, number] | [string, number][],
    ...infer T extends (string[] | [string, number] | [string, number][])[]
  ]
    ? F extends string[]
      ? S extends string[]
        ? collapse<[S, ...T], B> //if we have two "cd"s in a row, discard the first one and try again
        : collapse<[S, ...T], [...B, F]> //otherwise if we have a "cd" followed by a file, move the "cd" to the output array
      : F extends [string, number]
      ? S extends [string, number]
        ? collapse<[[F, S], ...T], B> //if we have two files in a row, combine them into an array object and try again
        : collapse<[S, ...T], [...B, [F]]> //if we have a file followed by a cd, move the "cd" to the output array, but make it a singleton
      : F extends [string, number][]
      ? S extends [string, number]
        ? collapse<[[...F, S], ...T], B> //if we've already collapsed some files, and we encounter a new one, keep collapsing it
        : S extends [string, number][]
        ? collapse<[[...F, ...S], ...T], B> //if we have two piles in a row, merge them. this will only happen after joining the chunks.
        : collapse<[S, ...T], [...B, F]> //otherwise move the collapsed pile to the output array
      : never //out of cases for F, this should never happend
    : A extends [
        infer F extends string[] | [string, number] | [string, number][]
      ] //single element left
    ? F extends [string, number] // if it's a lone file, still have to box it
      ? [...B, [F]]
      : [...B, F]
    : B;

  // call transformChunk on each chunk, then pass the CWD to the next chunk and keep going. Also collapses each chunk after transforming.
  type mapTransformChunk<
    S extends string[][],
    P extends string[] = [],
    R extends (string[] | [string, number][])[][] = []
  > = S extends [infer H extends string[], ...infer T extends string[][]]
    ? transformChunk<H, P> extends [
        infer P2 extends string[],
        infer R2 extends (string[] | [string, number])[]
      ]
      ? mapTransformChunk<T, P2, [...R, collapse<R2>]>
      : never
    : R;

  // general array flatten
  type flatten<A extends any[][], B extends any[] = []> = A extends [
    infer H extends any[],
    ...infer T extends any[][]
  ]
    ? flatten<T, [...B, ...H]>
    : B;

  // string join with . delimiter.
  type join<A extends string[], B extends string = ""> = A extends [
    infer H extends string,
    ...infer T extends string[]
  ]
    ? B extends ""
      ? join<T, H>
      : join<T, `${B}.${H}`>
    : B;

  // after smooshing all the files and cds together, we can unchunk to get a single stream.
  // however, we might have a seam where a single ls listing crossed a chunk border, so we
  // have to do one final smoosh to get the perfect stream. This is just another call to collapse

  // take the smooshed list of [dir, files, dir, files, ...] and combine it into an object, so that it can be indexed.
  type build<
    A extends (string[] | [string, number][])[],
    B extends { [k: string]: [string, number][] } = {}
  > = A extends [
    infer P extends string[],
    infer F extends [string, number][],
    ...infer T extends (string[] | [string, number][])[]
  ] //should be: 1 dir, then 1 file blob, then more
    ? join<P> extends infer K extends string
      ? K extends keyof B
        ? build<T, B> //if the key is already used, don't do anything, just skip this pair
        : build<T, B & { [J in K]: F }> //otherwise, add this key and keep going
      : never
    : B;

  // now we have our object that maps paths (.-delimited) to an array of their contents, with 0 for directories.
  // next step is to measure every directory. Rather than doing this in-situ, we do this by building a parallel directory size object.
  // this is both easier and solves the final step more nicely.

  // take a given folder contents, and return the names of any directories that are in it that aren't in the directory map.
  // L is the contents, P is CWD, M is the map so far. Output an array of paths.
  type findUncountedDirs<
    L extends [string, number][],
    P extends string[],
    M extends { [k: string]: number },
    R extends string[][] = []
  > = L extends [
    [infer Q extends string, infer N extends number],
    ...infer T extends [string, number][]
  ]
    ? N extends 0
      ? join<[...P, Q]> extends keyof M
        ? findUncountedDirs<T, P, M, R> //skip if this dir (with full path) is already in the map
        : findUncountedDirs<T, P, M, [...R, [...P, Q]]> //missing dir from M so add to R
      : findUncountedDirs<T, P, M, R> //skip if there's a size here, since it's a file not a dir
    : R;

  // assuming we have dir sizes for subdirs in the map, return a new size map entry for this path
  type dirSize<
    L extends [string, number][],
    P extends string[],
    M extends { [k: string]: number },
    N extends number = 0
  > = L extends [
    [infer Q extends string, infer U extends number],
    ...infer T extends [string, number][]
  ]
    ? U extends 0
      ? dirSize<T, P, M, addNumbers<N, M[join<[...P, Q]>]>> // it's a dir, so lookup in the dir map
      : dirSize<T, P, M, addNumbers<N, U>> //it's a file, so just add it
    : { [J in join<P>]: N };

  // extends the directory sizemap R by adding an entry for the dir at path P. B is the filesystem.
  // do this by checking if it has any child dirs that are not yet handled, and if so, handle them (recursively), then call this again
  // when you have no more children unaccounted-for, then sum up, using the sizemap for directories
  type buildArrayCount<
    B extends { [k: string]: [string, number][] },
    P extends string[] = [],
    R extends { [k: string]: number } = {}
  > = join<P> extends infer J extends string
    ? findUncountedDirs<B[J], P, R> extends [
        infer H extends string[],
        ...infer _
      ]
      ? buildArrayCount<B, P, buildArrayCount<B, H, R>>
      : R & dirSize<B[J], P, R>
    : never;

  // I tried doing this where the dirsize map is an array (KV list) so that it could then be iterated. However, it hit max depth errors.
  // Instead it's an object and we need to do evil ts magic to get it to an array

  // union to intersection of functions in the return type
  type uToIF<U> = (U extends any ? (u: () => U) => void : never) extends (
    v: infer V
  ) => void
    ? V
    : never;
  // extract one from union
  type pickOne<U> = uToIF<U> extends () => infer V ? V : never;
  // union to tuple
  type asArray<U, A extends any[] = []> = pickOne<U> extends infer P
    ? [U] extends [P]
      ? [P, ...A]
      : asArray<Exclude<U, P>, [P, ...A]>
    : never;

  //convert dir size map to list of all sizes
  type allDirSizes<
    M extends { [k: string]: number },
    K extends any[] = asArray<keyof M>,
    R extends number[] = []
  > = K extends [infer H extends keyof M, ...infer T extends any[]]
    ? allDirSizes<M, T, [M[H], ...R]>
    : R;

  type filterBelow100k<
    N extends number[],
    M extends number[] = []
  > = N extends [infer H extends number, ...infer T extends number[]]
    ? lessThan<H, 100000> extends true //special for 100k exactly
      ? filterBelow100k<T, [H, ...M]> //include it
      : filterBelow100k<T, M> //otherwise dont
    : M;

  type arraySum<N extends number[], S extends number = 0> = N extends [
    infer H extends number,
    ...infer T extends number[]
  ]
    ? arraySum<T, addNumbers<S, H>>
    : S;

  // integer string adder (this is copypasted from day 1)

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

  type addNumbers<A extends number, B extends number> = parseNum<
    addStrings<`${A}`, `${B}`>
  > extends infer P extends number
    ? P
    : never;
  // --end copypaste

  // more math! we need subtraction and comparison and stuff

  // is A less than (or equal to) B. this is the real length compare, so it will break for huge numbers
  type numericLessThan<
    A extends number,
    B extends number,
    C extends null[] = []
  > = [...ofLength<A>, ...C]["length"] extends B
    ? true
    : [...ofLength<B>, ...C]["length"] extends A
    ? false
    : numericLessThan<A, B, [null, ...C]>;

  // is A less than (or equal to) B. This assumes both are strings of well formed numbers of EQUAL length
  type eqStrLessThan<
    A extends string,
    B extends string
  > = A extends `${infer HA extends number}${infer TA}`
    ? B extends `${infer HB extends number}${infer TB}`
      ? HA extends HB //first chars match, so recur on the remainder
        ? eqStrLessThan<TA, TB>
        : numericLessThan<HA, HB>
      : true
    : true;

  // measure length of string
  type stringLength<
    S extends string,
    C extends null[] = []
  > = S extends `${infer _}${infer T}`
    ? stringLength<T, [null, ...C]>
    : C["length"];

  // is A less than (or equal to B). This assumes both are well formed number strings.
  type strLessThan<
    A extends string,
    B extends string
  > = stringLength<A> extends infer AL extends number
    ? stringLength<B> extends infer BL extends number
      ? AL extends BL // are their lengths the same
        ? eqStrLessThan<A, B> //yes, compare for real
        : numericLessThan<AL, BL> //no, so just compare the lengths.
      : never
    : never;

  // is A less than (or equal to B)
  type lessThan<A extends number, B extends number> = strLessThan<
    `${A}`,
    `${B}`
  >;

  // subtraction!

  //native integer subtraction
  type difference<
    A extends number,
    B extends number,
    C extends boolean = false,
    D extends null[] = []
  > = C extends true
    ? difference<
        A,
        sum<B, 1> extends infer S extends number ? S : never,
        false,
        D
      > //if borrowing/carrying, add 1 to B
    : [...ofLength<B>, ...D]["length"] extends A //if B+D=A then A-B=D (no borrow necessary)
    ? [D["length"], false]
    : [...ofLength<B>, ...D]["length"] extends parseNum<`1${A}`> //otherwise, try to borrow a 1, so 1A-B=D (return true)
    ? [D["length"], true]
    : difference<A, B, C, [null, ...D]>; //keep counting

  // because we do subtraction on reversed numbers, 0s grow at the end
  type stripTrailingZeroes<S extends string> = S extends `${infer T}0`
    ? stripTrailingZeroes<T>
    : S;

  // subtract string B from string A. both strings are reversed with the ones place first.
  type subReversed<
    A extends string,
    B extends string,
    C extends boolean = false,
    D extends string = ""
  > = A extends `${infer HA}${infer TA}`
    ? B extends `${infer HB}${infer TB}`
      ? difference<parseNum<HA>, parseNum<HB>, C> extends [
          infer E extends number,
          infer C2 extends boolean
        ]
        ? subReversed<TA, TB, C2, `${D}${E}`>
        : never
      : difference<parseNum<HA>, 0, C> extends [
          infer E extends number,
          infer C2 extends boolean
        ]
      ? subReversed<TA, "", C2, `${D}${E}`>
      : never
    : B extends ""
    ? stripTrailingZeroes<D>
    : never; //this means B had more digits and was therefore larger than A. don't do this, so you get an error.

  type subtractStrings<A extends string, B extends string> = reverse<
    subReversed<reverse<A>, reverse<B>>
  >;
  type subtractNumbers<A extends number, B extends number> = parseNum<
    subtractStrings<`${A}`, `${B}`>
  >;

  // end math

  // data munging needs some extra assertion for weird recursion reasons
  type data<I extends string> = buildArrayCount<
    build<
      collapse<
        flatten<
          splitChunks<I> extends infer J extends string[][]
            ? mapTransformChunk<J>
            : never
        >
      >
    >
  >;
  type day7part1<I extends string> = arraySum<
    filterBelow100k<
      allDirSizes<data<I>> extends infer J extends number[] ? J : never
    >
  >;

  type filterAboveThreshold<
    N extends number[],
    E extends number,
    R extends number[] = []
  > = N extends [infer H extends number, ...infer T extends number[]]
    ? lessThan<E, H> extends true
      ? filterAboveThreshold<T, E, [H, ...R]>
      : filterAboveThreshold<T, E, R>
    : R;

  type minimum<N extends number[], M extends number> = N extends [
    infer H extends number,
    ...infer T extends number[]
  ]
    ? minimum<T, lessThan<H, M> extends true ? H : M>
    : M;

  type findSmallestAboveThreshold<
    N extends number[],
    E extends number
  > = filterAboveThreshold<N, E> extends [
    infer H extends number,
    ...infer T extends number[]
  ]
    ? minimum<T, H>
    : never;

  // more extra weird assertions
  type day7part2<I extends string> = data<I> extends infer B extends {
    [k: string]: number;
  }
    ? subtractNumbers<B[""], 40_000_000> extends infer T extends number
      ? findSmallestAboveThreshold<allDirSizes<B>, T>
      : never
    : never;

  type input = `
$ cd /
$ ls
187585 dgflmqwt.srm
dir gnpd
200058 hbnlqs
dir jsv
dir mfhzl
dir nljtr
dir nwzp
61949 qdswp.wfj
21980 rbq.hpj
dir rfwwwgr
dir sbnhc
dir zhfl
136762 zwg
$ cd gnpd
$ ls
dir dcqq
dir dnscfz
dir dwqbhgc
dir lsrb
167581 ndwfr.pbv
dir pbgrdvmc
dir sbnhc
144703 sct
dir smfhldss
$ cd dcqq
$ ls
dir bfdng
155230 mfhzl.bpw
dir mhpqqq
dir mpbpcv
24140 mrrznmvr.mmz
$ cd bfdng
$ ls
dir hjlch
dir sbnhc
$ cd hjlch
$ ls
239759 sct
$ cd ..
$ cd sbnhc
$ ls
221334 hbnlqs
$ cd ..
$ cd ..
$ cd mhpqqq
$ ls
250305 nfqs.crt
dir qqhz
60892 rbq.hpj
64587 tbzlnq
dir tcbgmw
dir vnlmlq
$ cd qqhz
$ ls
148009 sct
$ cd ..
$ cd tcbgmw
$ ls
85006 sbnhc
$ cd ..
$ cd vnlmlq
$ ls
21720 vsrrhvlt.qbs
$ cd ..
$ cd ..
$ cd mpbpcv
$ ls
146794 bdpld.ddm
$ cd ..
$ cd ..
$ cd dnscfz
$ ls
276175 mfhzl.ndh
248161 qjgzgm
dir vnlmlq
dir wwf
dir zjdhldlq
$ cd vnlmlq
$ ls
130051 ftjnfc
$ cd ..
$ cd wwf
$ ls
166550 dwvphbm.jtd
$ cd ..
$ cd zjdhldlq
$ ls
345090 hbnlqs
$ cd ..
$ cd ..
$ cd dwqbhgc
$ ls
310228 dwvphbm
157686 hbnlqs
48014 nfqs.crt
333356 rwb.njl
dir sbnhc
139174 sct
dir vjcl
$ cd sbnhc
$ ls
51605 bfqw.cjd
267184 fjvmbpf
169122 mfhzl.jrp
243630 sbnhc
$ cd ..
$ cd vjcl
$ ls
dir mfhzl
$ cd mfhzl
$ ls
302243 dcqq.djc
$ cd ..
$ cd ..
$ cd ..
$ cd lsrb
$ ls
311814 dcqq.prd
200118 rbq.hpj
$ cd ..
$ cd pbgrdvmc
$ ls
119324 cqhdvmzp.npw
277930 jhlrpmqg
dir jlcqmq
204425 pddmq
dir rqmhwhc
257084 sbnhc
338348 vnlmlq
$ cd jlcqmq
$ ls
24876 mfhzl
$ cd ..
$ cd rqmhwhc
$ ls
36575 dlft.dtp
$ cd ..
$ cd ..
$ cd sbnhc
$ ls
dir sbq
dir vmslnrmc
$ cd sbq
$ ls
15689 hpzgsl.svb
$ cd ..
$ cd vmslnrmc
$ ls
dir lcqpws
136481 nfqs.crt
29838 sbnhc
$ cd lcqpws
$ ls
168866 dcqq.pdp
322264 jmtwr.fzj
18732 sct
$ cd ..
$ cd ..
$ cd ..
$ cd smfhldss
$ ls
dir wfbssqj
$ cd wfbssqj
$ ls
134050 tgghrp.hjq
$ cd ..
$ cd ..
$ cd ..
$ cd jsv
$ ls
dir bwc
dir dcqq
260913 lzcqm.wzr
dir rhstw
dir vnlmlq
$ cd bwc
$ ls
221975 bdv.mfq
dir crbnzrtw
dir dcqq
dir gdgh
101246 gqcfrzmn
dir gsst
dir jwrhclh
dir nbwfdvsv
dir qnwhfv
dir sbnhc
$ cd crbnzrtw
$ ls
dir dmmpcrz
204859 dwvphbm.csz
dir jdh
dir mpgdhg
202360 nfqs.crt
dir sbnhc
302165 scpq.gpd
dir shfhmdw
dir wmjgmd
$ cd dmmpcrz
$ ls
dir mfhzl
$ cd mfhzl
$ ls
121861 hbnlqs
$ cd ..
$ cd ..
$ cd jdh
$ ls
dir dwvphbm
$ cd dwvphbm
$ ls
8977 ntdtdq
$ cd ..
$ cd ..
$ cd mpgdhg
$ ls
48235 dcqq
$ cd ..
$ cd sbnhc
$ ls
dir dbb
$ cd dbb
$ ls
275648 gcsdd.pdw
dir rbbgrtm
dir rmlm
111336 sbnhc.qrn
153146 sct
$ cd rbbgrtm
$ ls
304685 rbq.hpj
$ cd ..
$ cd rmlm
$ ls
dir wfr
$ cd wfr
$ ls
197220 dhjjr.dqq
$ cd ..
$ cd ..
$ cd ..
$ cd ..
$ cd shfhmdw
$ ls
221308 mhnfzmz.gqp
$ cd ..
$ cd wmjgmd
$ ls
dir psrshrws
dir zrtpgbg
$ cd psrshrws
$ ls
202052 twgfblm
$ cd ..
$ cd zrtpgbg
$ ls
48134 hsnzvhvm.gnp
$ cd ..
$ cd ..
$ cd ..
$ cd dcqq
$ ls
63600 tlclsj.pvg
181384 tzjn
90096 wgq.lrm
$ cd ..
$ cd gdgh
$ ls
78450 hrcdgnpv.ctz
$ cd ..
$ cd gsst
$ ls
345240 nfqs.crt
199259 sct
$ cd ..
$ cd jwrhclh
$ ls
dir ftjcr
177499 nhdh.bbn
dir sbnhc
dir vnlmlq
dir wqjnwgpj
$ cd ftjcr
$ ls
dir glfptjpb
121761 gqp
36602 lcgfmtf.zct
dir mfhzl
dir rrrrgbqv
236133 wdmwgzvs.jnw
dir zwrmjlh
$ cd glfptjpb
$ ls
dir fdnppcr
dir gchhnd
dir gdphvds
98000 gqhv
$ cd fdnppcr
$ ls
dir dwvphbm
dir ngsgrgp
$ cd dwvphbm
$ ls
dir wrg
$ cd wrg
$ ls
265022 cqhdvmzp.npw
316916 nfqs.crt
$ cd ..
$ cd ..
$ cd ngsgrgp
$ ls
110198 sct
$ cd ..
$ cd ..
$ cd gchhnd
$ ls
253836 hbnlqs
39462 mfhzl
211458 nfqs.crt
$ cd ..
$ cd gdphvds
$ ls
dir dpdb
$ cd dpdb
$ ls
342610 vnlmlq
$ cd ..
$ cd ..
$ cd ..
$ cd mfhzl
$ ls
dir cptj
$ cd cptj
$ ls
100729 nvctqj.gjw
$ cd ..
$ cd ..
$ cd rrrrgbqv
$ ls
166055 dwvphbm.rvb
303762 hbnlqs
277411 wzr.rgz
$ cd ..
$ cd zwrmjlh
$ ls
32583 dvfnw
$ cd ..
$ cd ..
$ cd sbnhc
$ ls
dir hwtmwp
334229 mfhzl
299303 vtrfbw.dng
$ cd hwtmwp
$ ls
dir zjmrr
$ cd zjmrr
$ ls
279103 cqhdvmzp.npw
$ cd ..
$ cd ..
$ cd ..
$ cd vnlmlq
$ ls
dir btqsh
dir clhclcr
237487 cqhdvmzp.npw
11669 gqhltqf
91205 hbnlqs
dir qwbnvzv
234450 rqlnhpc.qfd
dir vbrc
dir vfdqq
$ cd btqsh
$ ls
dir lgh
dir ljrjpg
34333 rbq.hpj
15387 vzldp.ffs
$ cd lgh
$ ls
176966 vnlmlq
$ cd ..
$ cd ljrjpg
$ ls
231230 cqhdvmzp.npw
dir dwvphbm
dir mfhzl
251554 rdrbn.clr
180447 sbnhc
$ cd dwvphbm
$ ls
dir vghvsmq
$ cd vghvsmq
$ ls
132209 cqhdvmzp.npw
dir jqmgn
$ cd jqmgn
$ ls
95992 clbvg.bmr
$ cd ..
$ cd ..
$ cd ..
$ cd mfhzl
$ ls
dir dcqq
$ cd dcqq
$ ls
dir vjhl
$ cd vjhl
$ ls
dir nbhmzl
$ cd nbhmzl
$ ls
155454 sbnhc.flh
$ cd ..
$ cd ..
$ cd ..
$ cd ..
$ cd ..
$ cd ..
$ cd clhclcr
$ ls
dir jwqwhq
268077 njcmcfl.ctm
$ cd jwqwhq
$ ls
256988 rbq.hpj
$ cd ..
$ cd ..
$ cd qwbnvzv
$ ls
167852 dln.zrn
dir hpwpm
131149 lsc.tjj
dir mfhzl
dir mzhwwrtp
201277 sbnhc.pfh
147232 zlmgttpl
$ cd hpwpm
$ ls
135194 jpzt.fjn
$ cd ..
$ cd mfhzl
$ ls
166015 jrcqvgf.jdg
$ cd ..
$ cd mzhwwrtp
$ ls
231983 dgrvfdmp
121846 dwvphbm.lvp
$ cd ..
$ cd ..
$ cd vbrc
$ ls
320029 wbhs.mpd
$ cd ..
$ cd vfdqq
$ ls
277998 nfqs.crt
dir qzgwglhc
dir vnlmlq
68520 wsc.vhz
dir zfdhthfn
$ cd qzgwglhc
$ ls
25046 cqhdvmzp.npw
250876 dwvphbm
$ cd ..
$ cd vnlmlq
$ ls
212688 hbnlqs
8202 mlpl.tsp
69495 vnlmlq.thv
281200 vzdwr.tbl
$ cd ..
$ cd zfdhthfn
$ ls
233242 dstb.hrs
269387 nfqs.crt
$ cd ..
$ cd ..
$ cd ..
$ cd wqjnwgpj
$ ls
dir hfd
dir lbft
dir rtlw
dir vbf
$ cd hfd
$ ls
224694 cqhdvmzp.npw
100103 dbmwn.tqz
$ cd ..
$ cd lbft
$ ls
60107 hbnlqs
$ cd ..
$ cd rtlw
$ ls
dir ntpb
$ cd ntpb
$ ls
341166 mfhzl.pvj
$ cd ..
$ cd ..
$ cd vbf
$ ls
54177 ghrscj.tlh
$ cd ..
$ cd ..
$ cd ..
$ cd nbwfdvsv
$ ls
107273 mptw.qmn
$ cd ..
$ cd qnwhfv
$ ls
55633 hbnlqs
$ cd ..
$ cd sbnhc
$ ls
173163 vnlmlq
$ cd ..
$ cd ..
$ cd dcqq
$ ls
217679 hbnlqs
146747 ltp
$ cd ..
$ cd rhstw
$ ls
dir clh
dir grz
dir ntjtzr
dir qrjgl
dir rzqp
dir tzgrs
dir zrdh
$ cd clh
$ ls
212153 cqhdvmzp.npw
$ cd ..
$ cd grz
$ ls
346002 cqhdvmzp.npw
$ cd ..
$ cd ntjtzr
$ ls
271549 rbq.hpj
308693 sbnhc.zrv
$ cd ..
$ cd qrjgl
$ ls
119344 jfshwj
$ cd ..
$ cd rzqp
$ ls
327891 dcqq
210282 hlmnv.jph
118199 nfqs.crt
dir rwh
$ cd rwh
$ ls
285057 rmvrnb
$ cd ..
$ cd ..
$ cd tzgrs
$ ls
23830 cjqrr
$ cd ..
$ cd zrdh
$ ls
dir dcqq
dir dwvphbm
188911 rbq.hpj
dir vpnzs
$ cd dcqq
$ ls
277454 hbnlqs
dir jnncgzgm
$ cd jnncgzgm
$ ls
199664 dcqq.tgm
$ cd ..
$ cd ..
$ cd dwvphbm
$ ls
221700 fgnznr.dhf
$ cd ..
$ cd vpnzs
$ ls
254459 fvcf.zcj
$ cd ..
$ cd ..
$ cd ..
$ cd vnlmlq
$ ls
dir gfsj
$ cd gfsj
$ ls
dir hddvr
$ cd hddvr
$ ls
dir mqmnzb
$ cd mqmnzb
$ ls
341835 jjjh
$ cd ..
$ cd ..
$ cd ..
$ cd ..
$ cd ..
$ cd mfhzl
$ ls
dir pccldwf
$ cd pccldwf
$ ls
126977 nvcw
318605 rljpfnc.dzd
$ cd ..
$ cd ..
$ cd nljtr
$ ls
dir slztzqd
$ cd slztzqd
$ ls
55754 bpwghjpg.bfq
205753 pfplh
319151 vdlmjj.mmn
dir vnlmlq
$ cd vnlmlq
$ ls
dir mfhzl
338081 zhjrrs
dir zpj
$ cd mfhzl
$ ls
dir dcqq
dir lgfb
dir rjbprpnl
343125 vnlmlq.zpr
$ cd dcqq
$ ls
288030 rbq.hpj
$ cd ..
$ cd lgfb
$ ls
22119 cqhdvmzp.npw
238775 wbmnzgt.vnl
$ cd ..
$ cd rjbprpnl
$ ls
244896 lvgg.jvz
$ cd ..
$ cd ..
$ cd zpj
$ ls
339679 dcqq
$ cd ..
$ cd ..
$ cd ..
$ cd ..
$ cd nwzp
$ ls
dir mfhzl
dir vnlmlq
$ cd mfhzl
$ ls
107297 dwvphbm.nvb
$ cd ..
$ cd vnlmlq
$ ls
dir mdj
$ cd mdj
$ ls
87553 dbtct.nws
$ cd ..
$ cd ..
$ cd ..
$ cd rfwwwgr
$ ls
287719 flpwrp
74896 mfhzl
$ cd ..
$ cd sbnhc
$ ls
232949 dcqq.rnj
dir dwvphbm
$ cd dwvphbm
$ ls
21955 pcqbfbv.bfg
$ cd ..
$ cd ..
$ cd zhfl
$ ls
dir jvnlhq
dir vnlmlq
180619 wcd.jsr
$ cd jvnlhq
$ ls
20692 clp.vmd
dir dbn
91389 jqbp.zss
dir njmdrb
dir sbnhc
dir sdrrzp
192374 vnlmlq.lvj
$ cd dbn
$ ls
293401 dcqq
$ cd ..
$ cd njmdrb
$ ls
270463 dvzbtnbb.vth
dir gdvtg
219739 hsdg.rss
dir mfhzl
285584 mhq
dir mllvdccz
234503 nfqs.crt
$ cd gdvtg
$ ls
294243 dllnh
27407 rws.vqt
$ cd ..
$ cd mfhzl
$ ls
dir dwvphbm
154477 nbphv.pjc
dir qpnncj
33994 splscqn.tqz
dir vnlmlq
$ cd dwvphbm
$ ls
87960 sct
$ cd ..
$ cd qpnncj
$ ls
182692 lqbbz
$ cd ..
$ cd vnlmlq
$ ls
285614 bfrjhpv.dvn
121146 nfqs.crt
84544 sbnhc
$ cd ..
$ cd ..
$ cd mllvdccz
$ ls
184878 bsjzsmw.pwt
184061 dcqq.bbm
243546 dwvphbm.rdw
dir ftmrszgl
8251 rbq.hpj
dir tgvchzn
$ cd ftmrszgl
$ ls
267439 bdrn.gfb
257447 npcrg.gjn
$ cd ..
$ cd tgvchzn
$ ls
227775 lqbftlg.scr
$ cd ..
$ cd ..
$ cd ..
$ cd sbnhc
$ ls
245520 tjp.pml
$ cd ..
$ cd sdrrzp
$ ls
dir dcqq
7894 gstzs
dir rnjcrjj
dir sbnhc
$ cd dcqq
$ ls
340987 sjb.nss
$ cd ..
$ cd rnjcrjj
$ ls
67782 rbq.hpj
$ cd ..
$ cd sbnhc
$ ls
156705 zwr.rtg
$ cd ..
$ cd ..
$ cd ..
$ cd vnlmlq
$ ls
dir dwvphbm
dir jgc
dir lbh
dir lrwt
dir rhszw
213882 sbnhc.dzl
dir vnlmlq
2798 vwwbhsnb.dms
$ cd dwvphbm
$ ls
257972 zccsn.bdr
$ cd ..
$ cd jgc
$ ls
85911 cqhdvmzp.npw
dir fnvjv
49760 grsw
dir ntz
249818 rgzqq.tlr
$ cd fnvjv
$ ls
288935 dcqq.bsq
dir nwlbbwtq
264238 tcwwzs.zwg
$ cd nwlbbwtq
$ ls
dir qcm
318151 sbnhc.lwr
322077 stb.cqj
$ cd qcm
$ ls
147721 crrdn
dir gctnt
59476 rbq.hpj
dir sbnhc
$ cd gctnt
$ ls
328909 dwvphbm
82536 rjnz
$ cd ..
$ cd sbnhc
$ ls
35956 nfqs.crt
89464 qvhvlcl.nzq
dir vvn
$ cd vvn
$ ls
119247 fztlb.qch
79030 vnlmlq
$ cd ..
$ cd ..
$ cd ..
$ cd ..
$ cd ..
$ cd ntz
$ ls
234879 mfhzl
$ cd ..
$ cd ..
$ cd lbh
$ ls
dir dwvphbm
24310 jgsp.ggs
dir lft
$ cd dwvphbm
$ ls
295434 rbq.hpj
$ cd ..
$ cd lft
$ ls
dir dcqq
dir dwvphbm
123657 mfhzl.nhq
$ cd dcqq
$ ls
dir tgp
$ cd tgp
$ ls
271647 gmmq.tmp
$ cd ..
$ cd ..
$ cd dwvphbm
$ ls
dir pftcdtd
108321 qtqhqwnt
$ cd pftcdtd
$ ls
28073 hwqzcr.zcp
$ cd ..
$ cd ..
$ cd ..
$ cd ..
$ cd lrwt
$ ls
38953 hzhzfw.tpv
59885 vnlmlq
$ cd ..
$ cd rhszw
$ ls
dir hsfbh
dir mmflqvsd
20071 rhdbms
162563 rpjjld
dir vnlmlq
$ cd hsfbh
$ ls
255050 lglw.jvw
99814 pzvw
28443 sbct.hng
168934 sbnhc.fnt
dir wnwztl
$ cd wnwztl
$ ls
dir brwhjj
215806 dcqq
214967 mqhv.wwq
82998 vcm.mhc
$ cd brwhjj
$ ls
171935 rbq.hpj
$ cd ..
$ cd ..
$ cd ..
$ cd mmflqvsd
$ ls
109141 dcqq.mdc
$ cd ..
$ cd vnlmlq
$ ls
dir blggqt
117656 dcqq.vlg
dir fpw
195879 gsb.dvw
dir mfhzl
5068 mnfdf
dir mtg
dir vnlmlq
$ cd blggqt
$ ls
195700 ntv.zjn
$ cd ..
$ cd fpw
$ ls
143105 sct
$ cd ..
$ cd mfhzl
$ ls
dir cpcczt
47767 nzzcn.qhp
dir zdv
$ cd cpcczt
$ ls
209755 vnlmlq.lbw
$ cd ..
$ cd zdv
$ ls
335546 sbnhc.ccg
$ cd ..
$ cd ..
$ cd mtg
$ ls
244632 dcqq.frr
240873 tpvqthc.ljw
dir zdtnqtcw
$ cd zdtnqtcw
$ ls
80980 nfqs.crt
$ cd ..
$ cd ..
$ cd vnlmlq
$ ls
153953 dwvphbm
$ cd ..
$ cd ..
$ cd ..
$ cd vnlmlq
$ ls
dir dcqq
dir dwvphbm
155333 mmhjscr.mrh
293720 nfqs.crt
dir qnv
dir rdvq
226720 zgmtqvws
160920 zgnft
$ cd dcqq
$ ls
142227 cqhdvmzp.npw
199798 twqppvs
$ cd ..
$ cd dwvphbm
$ ls
58807 cdbdnrqh.fgq
224321 hbnlqs
340073 sbnhc
337932 sct
2613 vdc.nwz
$ cd ..
$ cd qnv
$ ls
244311 cqhdvmzp.npw
273687 jhqt.glz
dir mnrh
240044 nfqs.crt
49861 pwsgmlq.hcw
dir rdrs
126195 vnlmlq.frr
$ cd mnrh
$ ls
276125 hbnlqs
$ cd ..
$ cd rdrs
$ ls
dir dqgw
213018 dwvphbm
13785 hbnlqs
dir lbpjczw
116081 nfqs.crt
154367 rbq.hpj
77634 sct
$ cd dqgw
$ ls
dir rpcfdr
$ cd rpcfdr
$ ls
dir swvlhbg
$ cd swvlhbg
$ ls
309244 sct
$ cd ..
$ cd ..
$ cd ..
$ cd lbpjczw
$ ls
69436 rbq.hpj
$ cd ..
$ cd ..
$ cd ..
$ cd rdvq
$ ls
128806 dcqq.qzr
64132 dcqq.vgc
dir hht
165359 jzj.rqv
dir sbnhc
$ cd hht
$ ls
dir vnlmlq
$ cd vnlmlq
$ ls
49895 wct
$ cd ..
$ cd ..
$ cd sbnhc
$ ls
265434 vnlmlq
`;

  type output = [day7part1<input>, day7part2<input>];
}
