namespace day9 {
  // This is the day when I gave up on making a proper `type output = solution<input>` transformer.
  // It still derives the answer from the type `input`, though.
  // This is because I couldn't avoid maximum recursion depth problems trying to make a generic solution.
  // There might be an answer but it's almost tomorrow.

  // integer string adder

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

  // only call with 1- or 2-digit numbers - returns [digit, carry]
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
  type addPosStr<A extends string, B extends string> = reverse<
    addReversed<reverse<A>, reverse<B>>
  > extends infer R extends string
    ? R
    : never;

  // test if strict A<B. uses arraylength compare, only useful for comparing small numbers, this is for comparing digits to build the real lessThan.
  type numericLessThan<
    A extends number,
    B extends number,
    C extends null[] = []
  > = [...C, ...ofLength<B>]["length"] extends A
    ? false
    : [...C, ...ofLength<A>]["length"] extends B
    ? true
    : numericLessThan<A, B, [null, ...C]>;

  // test if strict A<B (both are strings of equal lengths)
  type eqStrLessThan<
    A extends string,
    B extends string
  > = A extends `${infer HA extends number}${infer TA}`
    ? B extends `${infer HB extends number}${infer TB}`
      ? HA extends HB
        ? eqStrLessThan<TA, TB>
        : numericLessThan<HA, HB>
      : false
    : false;

  //length of string
  type stringLength<
    S extends string,
    C extends null[] = []
  > = S extends `${infer _}${infer T}`
    ? stringLength<T, [null, ...C]>
    : C["length"];

  // test if strict A<B (both are strings)
  type strLessThan<
    A extends string,
    B extends string
  > = stringLength<A> extends infer AL extends number
    ? stringLength<B> extends infer BL extends number
      ? AL extends BL
        ? eqStrLessThan<A, B>
        : numericLessThan<AL, BL>
      : never
    : never;

  // test if strict A<B.
  type lessThan<A extends number, B extends number> = strLessThan<
    `${A}`,
    `${B}`
  >;

  // length based A-B. both are positive. returns never if B>A.
  type posDif<A extends null[], B extends null[], C extends null[] = []> = [
    ...B,
    ...C
  ]["length"] extends A["length"]
    ? C["length"]
    : [...A, ...C]["length"] extends B["length"]
    ? never
    : posDif<A, B, [null, ...C]>;

  // A-B with borrowing support. C is true if borrow from previous place. returns [digit, borrow from next]
  type subDigit<
    A extends null[],
    B extends null[],
    C extends boolean = false
  > = C extends true
    ? subDigit<A, [null, ...B], false> //if borrowing, just add 1 to B
    : lessThan<A["length"], B["length"]> extends true
    ? [posDif<[...ofLength<10>, ...A], B>, true]
    : [posDif<A, B>, false];

  // remove all leading zeroes unless the string is exactly '0'
  type stripLeadingZeroes<S extends string> = S extends `0${infer T}`
    ? T extends ""
      ? S
      : stripLeadingZeroes<T>
    : S;

  // perform A-B on strings. They are in reverse order, so 1s place first. A must be >= B
  type subReversed<
    A extends string,
    B extends string,
    C extends boolean = false,
    D extends string = ""
  > = A extends `${infer HA}${infer TA}`
    ? B extends `${infer HB}${infer TB}`
      ? subDigit<ofLength<parseNum<HA>>, ofLength<parseNum<HB>>, C> extends [
          infer E extends number,
          infer C2 extends boolean
        ]
        ? subReversed<TA, TB, C2, `${E}${D}`>
        : never
      : subDigit<ofLength<parseNum<HA>>, [], C> extends [
          infer E extends number,
          infer C2 extends boolean
        ]
      ? subReversed<TA, "", C2, `${E}${D}`>
      : never
    : stripLeadingZeroes<D>;

  // perform A-B on strings. They are forwards. either can be larger but both must be positive.
  type subPosStr<A extends string, B extends string> = strLessThan<
    A,
    B
  > extends true
    ? `-${subReversed<reverse<B>, reverse<A>>}`
    : subReversed<reverse<A>, reverse<B>>;

  // negative to positive
  type isNegative<N extends string> = N extends `-${string}` ? true : false;
  type flipSign<S extends string> = S extends "0"
    ? "0"
    : S extends `-${infer T}`
    ? T
    : `-${S}`;

  // add number strings of any sign (convert to subtraction for negatives)
  type addStrings<A extends string, B extends string> = (
    isNegative<A> extends true
      ? isNegative<B> extends true
        ? flipSign<addPosStr<flipSign<A>, flipSign<B>>>
        : subPosStr<B, flipSign<A>>
      : isNegative<B> extends true
      ? subPosStr<A, flipSign<B>>
      : addPosStr<A, B>
  ) extends infer S extends string
    ? S
    : never;

  // A-B = A+-B
  type subtractStrings<A extends string, B extends string> = addStrings<
    A,
    flipSign<B>
  >;

  // end math

  // part 1

  type uldr = "U" | "L" | "D" | "R";

  // the coords array is head then successive knots.
  // the first bonus string is a union type that will be |ed with successive positions (in x/y format)
  // the union type will prevent duplicates.
  // the second bonus string is a number counter for how many times the previous union operation has actually added a new pos
  type state = [[string, string][], string, string];

  // start with head and tail at both 0, the position union starts containing the origin, which is a total of 1 places
  type initState = [[["0", "0"], ["0", "0"]], "0/0", "1"];

  // given a head pos (may be disjointed), and a list of tail pos, update each tail pos to the previous.
  type moveTail<
    L extends [string, string],
    K extends [string, string][],
    A extends [string, string][] = []
  > = L extends [infer HX extends string, infer HY extends string]
    ? K extends [
        [infer TX extends string, infer TY extends string],
        ...infer R extends [string, string][]
      ]
      ? [subtractStrings<HX, TX>, subtractStrings<HY, TY>] extends [
          infer DX extends string,
          infer DY extends string
        ]
        ? DX extends "2"
          ? DY extends "2"
            ? moveTail<[addStrings<TX, "1">, addStrings<TY, "1">], R, [...A, L]> //pull diagonal up right
            : DY extends "-2"
            ? moveTail<
                [addStrings<TX, "1">, subtractStrings<TY, "1">],
                R,
                [...A, L]
              > //pull diagonal down right
            : moveTail<[addStrings<TX, "1">, HY], R, [...A, L]> //pull  right but not a main diagonal, so snap to height
          : DX extends "-2"
          ? DY extends "2"
            ? moveTail<
                [subtractStrings<TX, "1">, addStrings<TY, "1">],
                R,
                [...A, L]
              > //pull diagonal up left
            : DY extends "-2"
            ? moveTail<
                [subtractStrings<TX, "1">, subtractStrings<TY, "1">],
                R,
                [...A, L]
              > //pull diagonal down left
            : moveTail<[subtractStrings<TX, "1">, HY], R, [...A, L]> // pull left but not a main diagonal, so snap to height
          : DY extends "2"
          ? moveTail<[HX, addStrings<TY, "1">], R, [...A, L]> // pull up but not a main diagonal, so snap to horiz. pos.
          : DY extends "-2"
          ? moveTail<[HX, subtractStrings<TY, "1">], R, [...A, L]> //pull down but not a main diagonal, so snap to horiz. pos.
          : moveTail<[TX, TY], R, [...A, L]> // not pulled.
        : never
      : [...A, L] //no more tails
    : never;

  type moveHead<
    HX extends string,
    HY extends string,
    D extends uldr
  > = D extends "U"
    ? [HX, addStrings<HY, "1">]
    : D extends "L"
    ? [subtractStrings<HX, "1">, HY]
    : D extends "D"
    ? [HX, subtractStrings<HY, "1">]
    : [addStrings<HX, "1">, HY];

  // take a pos list, direction, and existing trail.
  // move all the pos by direction, and update the trail.
  // return [new pos, new trail, trailUpdated?]
  type moveAll<
    S extends [string, string][],
    D extends uldr,
    U extends string
  > = S extends [
    [infer HX extends string, infer HY extends string],
    ...infer T extends [string, string][]
  ]
    ? moveTail<moveHead<HX, HY, D>, T> extends [
        ...infer T2 extends [string, string][],
        [infer LX extends string, infer LY extends string]
      ]
      ? [
          [...T2, [LX, LY]],
          `${LX}/${LY}` | U,
          `${LX}/${LY}` extends U ? false : true
        ]
      : never
    : never;

  // move a number of spaces in the same direction.
  // input pos array, [dir, count], existingTrail.
  // move one in dir, decrement count, replace trail.
  // also keeps a counter, and increment it every time the trail updates
  type makeStep<
    S extends [string, string][],
    D extends uldr,
    C extends string,
    U extends string,
    V extends null[] = []
  > = C extends "0"
    ? [S, U, `${V["length"]}`]
    : moveAll<S, D, U> extends [
        infer S2 extends [string, string][],
        infer U2 extends string,
        infer B extends boolean
      ]
    ? makeStep<
        S2,
        D,
        subtractStrings<C, "1">,
        U2,
        B extends true ? [null, ...V] : V
      >
    : never;

  // state->state transition. run makeStep to get new pos and new trail, then add the number of times U changed (V2) to existing V counter.
  type runStep<A extends state, D extends uldr, C extends string> = A extends [
    infer S extends [string, string][],
    infer U extends string,
    infer V extends string
  ]
    ? makeStep<S, D, C, U> extends [
        infer S2 extends [string, string][],
        infer U2 extends string,
        infer V2 extends string
      ]
      ? [S2, U2, addStrings<V, V2>]
      : never
    : never;

  // make a list of moves.
  type makeMoves<S extends state, C extends [uldr, string][]> = C extends [
    [infer DH extends uldr, infer CH extends string],
    ...infer T extends [uldr, string][]
  ]
    ? runStep<S, DH, CH> extends infer U extends state
      ? makeMoves<U, T>
      : never
    : S;

  // because we chunked the input, make a list of lists of moves
  type mapMakeMoves<S extends state, C extends [uldr, string][][]> = C extends [
    infer H extends [uldr, string][],
    ...infer T extends [uldr, string][][]
  ]
    ? makeMoves<S, H> extends infer U extends state
      ? mapMakeMoves<U, T>
      : never
    : S;

  // deleteme: take
  type take<
    X extends any[],
    Y extends number,
    Z extends any[] = []
  > = Z["length"] extends Y
    ? Z
    : X extends [infer H, ...infer T extends any[]]
    ? take<T, Y, [...Z, H]>
    : Z;

  type drop<
    X extends any[],
    Y extends number,
    Z extends null[] = []
  > = Z["length"] extends Y
    ? X
    : X extends [infer _, ...infer T extends any[]]
    ? drop<T, Y, [null, ...Z]>
    : X;

  //solutions

  type initStateLong = [
    [
      ["0", "0"],
      ["0", "0"],
      ["0", "0"],
      ["0", "0"],
      ["0", "0"],
      ["0", "0"],
      ["0", "0"],
      ["0", "0"],
      ["0", "0"],
      ["0", "0"]
    ],
    "0/0",
    "1"
  ];

  // run until we hit a predetermined cutoff point (300 steps). This avoids max recursion depth.
  type run<J extends [state, string], N extends string = "0"> = N extends "300"
    ? J
    : J[1] extends `${infer L extends uldr} ${infer R}\n${infer T}`
    ? run<[runStep<J[0], L, R>, T], addStrings<N, "1">>
    : J;

  // repeatedly call run<> until we run out of input.
  // however, this doesn't work, it gets stuck at maximum recursion depth and hangs.
  // instead I will invoke run<> manually 7 times, to consume all 2000 lines of input.

  /*
  type runAll<J extends [state, string]> = run<J> extends infer K extends [
    state,
    string
  ]
    ? K[1] extends ""
      ? K[0]
      : runAll<K>
    : never;
  */

  // part 1
  type a = run<[initState, input]>;
  type b = run<a>;
  type c = run<b>;
  type d = run<c>;
  type e = run<d>;
  type f = run<e>;
  type g = run<f>;

  type day9part1 = g[0][2];

  type h = run<[initStateLong, input]>;
  type i = run<h>;
  type j = run<i>;
  type k = run<j>;
  type l = run<k>;
  type m = run<l>;
  type n = run<m>;

  type day9part2 = n[0][2];

  type input = `U 1
R 2
D 1
L 1
U 2
D 1
U 2
L 1
D 1
U 2
R 1
U 1
D 1
R 1
L 2
D 1
U 1
D 1
U 2
D 2
R 2
D 1
R 2
D 2
R 1
L 2
U 2
D 2
R 2
D 1
R 1
L 1
D 2
U 2
L 2
U 2
R 1
L 1
D 1
R 1
D 2
U 1
L 2
R 1
U 1
D 1
U 1
D 2
R 1
L 1
U 1
L 1
R 2
U 1
R 2
L 2
U 1
R 1
L 2
R 2
L 2
U 1
D 1
U 2
R 1
D 1
L 2
D 1
L 1
U 1
R 2
U 1
D 1
L 2
R 2
D 2
R 2
D 1
L 2
D 1
R 2
L 1
D 2
R 2
D 1
U 1
L 1
R 2
L 2
D 1
R 1
L 1
U 1
L 1
R 1
U 2
R 1
D 2
R 1
L 2
R 1
L 1
D 2
R 2
L 1
U 1
D 1
L 2
D 1
L 1
R 1
U 1
R 3
U 2
L 2
R 1
L 1
D 1
R 1
U 2
D 3
L 1
R 1
U 2
R 1
U 1
R 3
L 3
U 2
D 1
L 1
R 1
U 3
D 1
L 3
D 2
U 3
R 3
D 1
L 3
D 1
U 1
R 3
L 2
U 1
R 3
U 3
L 3
D 1
R 2
U 3
R 2
L 1
U 3
L 3
R 3
D 2
U 1
L 1
D 1
U 3
D 1
U 2
R 1
L 2
R 2
L 2
D 3
R 2
D 2
U 1
L 2
R 2
L 1
U 3
D 3
R 1
L 1
D 3
L 2
U 2
R 3
L 1
D 2
L 1
R 2
L 2
U 2
D 3
R 2
U 3
D 1
L 2
D 3
U 1
R 3
U 1
R 2
U 2
D 1
L 1
D 3
L 2
U 1
R 1
L 1
U 2
D 3
U 3
R 3
U 1
R 1
D 2
R 1
L 2
D 2
U 1
R 3
D 2
U 2
L 2
R 3
D 2
U 1
R 1
L 3
R 1
U 1
R 4
L 2
R 3
D 3
L 3
D 3
R 3
L 2
R 4
D 1
R 2
U 3
D 4
U 2
R 4
U 2
R 3
L 2
D 1
U 3
D 1
L 4
U 4
D 4
R 2
U 1
L 2
R 2
L 4
R 3
U 4
D 3
R 2
L 2
R 2
D 2
U 1
R 2
U 3
R 4
D 1
L 4
U 2
R 3
U 3
R 4
L 1
D 3
R 3
D 4
R 2
L 3
R 1
D 4
R 2
L 2
U 3
R 3
U 2
R 3
U 4
R 1
L 1
D 4
U 4
D 3
L 1
D 3
L 2
U 2
R 2
D 3
R 2
U 1
R 4
D 3
L 2
D 1
L 4
D 1
R 4
D 4
R 1
U 3
L 2
U 1
R 3
U 2
L 3
D 1
U 4
L 2
D 1
L 2
R 3
U 4
R 1
U 1
L 3
U 4
D 3
L 2
D 1
L 3
R 2
D 4
L 1
D 5
U 4
D 2
R 1
D 3
L 3
R 1
D 5
U 3
D 5
L 2
D 1
L 3
R 5
U 4
L 3
D 4
U 5
D 5
L 2
U 5
L 2
R 3
L 1
U 2
D 4
R 3
D 4
U 5
D 3
U 4
L 4
R 1
L 5
U 5
R 2
U 4
R 3
D 1
U 1
R 2
U 4
R 2
D 2
U 1
R 1
L 2
D 1
U 5
L 4
R 2
D 1
U 1
D 2
U 2
D 5
L 2
R 5
U 5
L 5
D 2
L 1
U 3
D 1
R 3
D 2
L 3
R 3
D 3
R 2
L 1
D 1
U 2
R 2
L 2
R 5
U 4
D 3
L 4
U 4
D 1
U 4
D 2
U 5
L 4
R 5
D 4
R 2
D 2
R 5
D 4
U 1
D 3
U 5
R 3
D 2
R 5
L 1
U 5
R 5
U 1
R 3
U 3
R 4
U 1
L 4
R 1
U 3
L 2
U 6
D 4
U 3
D 1
R 2
L 6
U 3
D 4
U 1
L 6
U 1
R 1
U 6
D 5
U 5
R 4
U 1
L 4
D 1
U 5
R 3
L 2
U 3
L 6
R 5
U 4
R 5
D 1
L 6
U 3
L 5
U 2
L 5
R 2
U 6
R 6
D 1
R 1
U 3
R 6
U 5
L 4
U 2
R 5
L 2
U 1
D 1
U 5
R 2
U 2
L 4
R 2
D 1
L 4
U 1
L 6
R 6
U 2
D 5
U 5
D 4
L 1
R 3
L 5
U 6
R 4
D 1
U 2
R 1
D 3
R 1
L 5
D 3
R 3
U 5
L 6
R 3
U 5
L 2
U 3
R 3
D 3
U 1
L 2
U 2
L 3
D 6
L 3
D 4
R 4
D 4
U 6
L 6
D 2
R 1
U 3
L 6
R 4
D 1
L 2
U 4
L 6
U 1
L 4
D 1
L 3
R 2
L 1
R 2
L 3
R 1
U 7
D 7
L 7
U 1
R 2
U 6
R 4
L 6
U 3
R 4
U 7
D 5
R 6
U 6
L 6
R 4
D 1
U 3
R 5
L 2
D 2
U 5
L 1
D 3
R 5
L 2
U 4
D 1
R 5
U 2
R 4
L 3
R 4
L 2
D 2
L 4
D 1
U 4
D 4
R 4
L 5
R 2
D 2
L 2
D 1
L 2
D 1
L 4
D 5
R 7
U 7
L 2
D 3
L 4
R 7
D 7
U 2
D 7
L 6
D 3
U 5
R 5
D 3
U 7
D 3
L 5
D 3
R 4
D 4
L 7
D 6
U 2
L 3
R 6
U 5
R 7
U 3
L 1
R 7
U 2
R 4
L 7
U 2
D 4
U 5
D 6
U 4
D 6
U 7
R 1
L 4
R 3
L 6
U 4
R 7
L 6
U 7
D 1
U 7
D 4
L 1
D 3
R 6
U 3
R 5
L 4
R 4
L 4
U 7
R 3
L 4
D 7
R 6
U 2
L 3
U 8
D 3
U 4
D 1
R 4
U 5
R 2
U 4
D 8
L 2
D 8
R 4
L 1
R 7
L 6
U 4
L 4
D 7
L 3
D 2
U 8
R 8
U 6
R 7
D 3
U 7
R 1
L 8
D 2
L 3
R 5
D 3
U 3
R 8
L 1
R 6
L 8
U 2
D 4
R 6
L 6
D 5
U 4
L 6
U 1
L 6
U 3
D 5
U 5
L 6
D 8
R 5
D 4
R 6
U 7
L 1
D 2
R 2
L 7
R 4
D 7
L 3
U 6
R 7
D 3
L 3
D 2
U 1
R 3
L 8
U 8
D 5
L 6
R 3
L 6
D 3
R 4
U 3
L 8
D 7
L 6
R 5
D 6
R 6
D 3
L 4
R 1
D 6
U 3
R 1
D 5
U 4
L 1
R 2
U 6
D 6
R 7
L 1
R 6
U 7
D 8
R 2
U 3
L 6
U 2
D 6
U 8
L 3
U 4
D 6
R 6
L 5
U 9
R 8
L 2
D 6
R 3
L 4
D 2
L 7
D 5
L 7
U 8
D 6
L 9
D 3
L 5
U 3
L 8
D 7
R 8
U 2
L 9
U 7
D 7
U 6
D 5
R 2
D 8
R 9
U 4
R 1
L 3
D 7
R 2
L 6
U 1
L 7
D 8
U 9
R 9
D 1
U 9
D 1
R 1
D 6
R 7
D 1
L 1
R 6
U 3
R 7
U 2
R 5
U 6
R 2
L 7
R 8
D 9
U 5
L 9
R 9
U 2
L 7
R 4
U 3
R 6
L 6
D 7
L 4
R 7
D 5
L 5
D 7
U 8
R 8
L 8
R 5
D 5
U 2
R 1
U 5
R 6
L 8
U 9
R 4
D 9
R 4
D 3
U 8
R 8
U 9
L 6
D 9
R 6
U 5
R 1
U 1
L 9
U 8
L 1
U 5
L 1
D 7
R 6
U 1
D 3
R 2
D 3
R 8
D 2
U 4
R 8
L 9
D 2
U 2
R 4
D 10
L 4
U 3
D 6
R 4
U 8
L 8
U 3
L 10
D 7
U 2
L 6
R 2
U 8
L 10
U 7
D 8
L 7
U 10
R 4
U 1
L 1
D 4
U 10
D 9
U 4
L 10
R 4
D 5
U 8
D 1
R 5
D 10
L 8
D 1
U 2
L 7
U 1
L 6
D 2
R 3
L 3
U 5
R 9
U 10
D 5
U 7
L 3
R 5
U 7
L 4
U 1
D 2
U 8
L 8
U 7
R 9
L 1
D 10
R 8
L 4
U 4
L 10
R 2
L 3
D 7
L 10
R 6
U 5
D 4
U 6
R 10
D 8
U 3
L 1
R 1
D 2
R 1
U 1
R 5
U 9
R 6
U 10
L 2
U 5
L 7
R 8
U 10
D 6
L 3
U 2
L 4
R 6
L 5
D 9
U 3
D 3
R 10
L 10
D 4
R 7
D 7
U 3
L 5
R 5
L 9
R 2
U 8
R 10
U 10
L 4
U 1
D 2
U 5
L 11
R 3
L 10
U 7
D 6
U 11
D 11
U 2
L 7
D 11
U 8
L 5
U 7
L 10
D 7
L 2
U 5
D 4
R 9
L 10
D 1
U 6
R 2
L 7
U 1
R 4
D 11
U 2
R 9
U 11
R 6
U 9
L 9
D 3
R 6
L 4
R 1
L 5
R 2
U 3
R 1
U 7
D 1
R 11
L 2
D 7
L 10
U 1
R 8
L 6
U 7
D 11
R 1
U 11
L 8
D 6
R 6
D 10
U 2
D 1
L 6
R 9
L 8
U 10
R 4
U 4
R 9
D 3
R 8
D 11
L 4
U 8
D 6
R 1
U 5
L 8
U 6
R 9
U 1
R 8
D 6
R 4
D 7
R 7
L 1
D 6
L 3
D 9
L 10
D 5
U 10
L 11
D 5
U 9
R 10
L 11
R 1
U 6
L 4
U 7
R 9
L 10
D 9
R 5
L 2
D 1
U 12
L 7
D 9
U 8
R 12
L 11
D 12
L 4
D 10
U 7
L 5
U 6
L 5
R 3
L 9
U 7
L 8
U 10
L 8
R 1
U 3
D 6
L 12
U 6
D 7
L 7
U 2
D 8
U 10
L 12
R 5
L 7
R 11
D 5
L 2
R 10
L 7
U 9
D 6
R 3
U 9
L 1
U 2
D 9
U 1
D 2
L 11
R 4
D 4
L 6
R 10
L 6
U 10
L 2
D 3
R 12
L 5
R 5
L 9
D 6
R 12
U 6
R 6
D 6
R 3
L 12
D 12
L 10
R 7
U 7
L 8
R 6
L 5
D 3
L 5
U 12
L 6
U 10
D 11
U 11
D 1
U 9
R 8
L 8
U 5
R 3
L 4
R 6
U 10
L 1
D 1
R 7
D 8
L 1
D 6
R 3
U 2
D 4
L 10
D 9
L 12
U 6
D 9
U 8
D 8
L 8
U 1
D 6
U 6
D 4
R 9
L 5
U 6
R 7
U 6
D 3
U 6
D 10
U 1
L 13
D 4
U 6
L 10
R 6
D 7
U 9
R 2
L 5
D 4
U 10
D 7
L 12
D 2
R 1
D 4
R 1
U 6
L 9
D 12
U 8
L 6
U 4
R 2
L 1
D 12
U 12
L 1
D 7
L 3
R 10
L 10
U 2
D 8
R 5
U 2
L 5
R 8
L 5
D 9
L 11
U 1
D 6
R 11
D 11
L 6
R 13
L 8
U 7
R 11
L 9
D 5
L 2
U 1
D 13
R 3
D 2
R 9
U 3
R 8
D 10
U 5
D 3
L 2
D 9
R 10
D 4
U 13
D 10
U 2
R 8
D 9
R 13
U 4
D 3
L 6
U 8
L 3
R 3
D 4
U 6
L 7
R 3
L 1
D 1
R 5
U 8
D 8
U 11
R 5
U 2
R 10
L 3
D 4
U 1
R 9
L 7
R 6
L 13
U 8
L 8
D 5
R 10
L 9
U 7
L 9
U 9
L 7
R 5
L 5
U 7
D 12
U 7
D 6
R 14
D 5
L 11
R 6
L 4
U 8
R 9
U 7
R 12
L 10
U 10
L 11
R 7
D 11
R 7
L 4
D 9
L 13
R 6
L 13
D 2
R 13
D 12
R 4
U 11
R 4
D 3
R 3
L 12
R 3
D 11
R 7
D 7
R 3
U 4
R 12
D 14
R 3
L 10
U 9
L 2
U 14
L 2
D 7
U 10
D 4
U 6
L 1
D 11
R 10
D 1
L 2
U 9
L 6
R 12
D 11
R 8
U 7
D 2
U 4
D 12
L 1
U 8
D 14
R 2
D 13
R 10
D 10
R 14
L 4
D 14
L 6
R 13
L 12
U 4
R 13
L 12
D 14
L 1
U 1
L 4
D 14
R 12
D 6
U 11
L 12
U 2
R 8
D 14
U 13
D 6
L 7
D 4
U 3
L 8
U 2
D 12
L 13
U 8
R 4
D 10
L 10
U 5
D 3
L 10
D 13
R 15
U 9
L 10
D 1
U 11
D 7
U 3
R 6
L 11
D 4
R 8
D 3
U 7
D 6
L 11
D 14
R 15
L 14
D 2
L 11
R 13
U 4
D 13
L 6
D 4
L 15
D 5
L 6
U 8
R 13
L 5
U 4
R 9
L 13
D 3
U 11
R 6
L 14
R 9
U 5
D 5
U 9
D 12
R 11
U 8
D 1
R 2
U 6
R 11
L 4
R 7
D 6
U 6
D 1
L 4
R 14
D 11
R 3
U 9
D 15
L 14
D 9
R 4
U 14
R 3
L 14
D 15
L 12
R 5
D 6
U 15
D 13
U 10
R 4
D 3
R 11
U 11
R 4
L 1
D 11
U 14
D 1
U 14
R 1
L 14
D 4
U 12
D 9
L 13
U 10
D 14
L 4
U 15
L 12
U 3
D 6
U 1
D 2
R 13
L 12
U 2
L 12
D 7
L 3
U 15
L 5
R 9
L 12
U 1
L 16
D 4
L 5
U 16
R 6
D 4
U 6
R 3
L 1
D 7
L 4
D 1
U 5
D 1
L 6
R 2
L 8
R 3
L 12
D 15
R 9
L 5
U 12
L 5
U 9
R 14
D 16
R 13
L 12
U 3
L 16
D 3
R 6
U 2
R 4
D 2
L 6
D 15
L 11
D 6
U 9
D 13
U 7
L 10
D 12
L 4
R 9
U 5
R 9
U 16
R 15
D 10
R 14
L 8
U 8
D 8
R 13
U 6
R 5
D 9
L 11
R 1
D 4
L 3
D 1
U 11
R 2
L 7
R 14
D 5
R 16
U 11
L 2
D 1
U 4
R 15
L 13
R 3
U 1
R 1
U 3
R 16
D 1
L 4
R 9
L 3
D 14
R 15
D 13
U 13
D 5
U 8
L 3
U 6
D 10
U 6
D 2
U 13
R 5
L 16
R 16
U 12
R 10
D 13
L 1
D 13
R 15
D 7
R 7
U 16
R 10
U 7
L 14
D 4
L 6
U 9
L 15
R 6
L 14
D 5
R 6
D 5
L 6
R 1
U 13
L 15
R 14
L 12
D 2
L 1
U 1
R 13
L 11
R 15
D 17
L 13
R 8
D 14
R 2
D 1
R 3
U 8
R 8
L 14
D 6
U 3
D 9
R 12
L 13
U 2
D 8
U 15
D 16
L 5
D 7
U 15
R 7
L 5
R 13
D 4
L 7
R 1
D 7
L 11
R 2
U 17
L 6
U 15
D 5
R 17
D 12
U 17
L 3
R 15
U 7
L 2
R 5
D 17
L 12
U 10
D 5
L 16
R 17
D 2
R 15
D 4
U 1
D 5
U 10
L 8
U 16
D 2
L 11
R 7
U 15
L 15
D 2
L 8
R 3
U 8
R 7
U 6
L 17
U 8
R 6
L 13
R 6
D 13
L 9
U 2
R 7
D 14
L 10
U 8
D 10
U 4
R 3
L 1
D 5
U 18
L 1
U 9
D 4
R 3
D 11
R 9
U 18
D 12
R 13
L 8
D 6
U 13
R 6
U 15
R 14
U 11
R 11
D 15
L 7
R 11
D 16
U 14
R 15
D 16
R 3
D 10
R 6
U 17
L 9
R 1
D 12
R 18
U 11
L 2
R 5
L 10
U 13
L 3
D 15
U 14
D 13
R 5
U 15
L 9
U 6
D 16
L 1
U 1
D 12
R 18
L 13
R 10
U 14
L 13
U 3
L 2
R 11
U 18
D 14
R 4
L 6
R 10
U 18
L 18
R 9
L 11
U 4
D 5
L 15
R 13
L 18
U 16
L 1
R 12
U 17
D 11
U 1
L 13
U 7
D 3
U 5
R 8
D 4
L 7
D 17
U 9
R 1
L 18
U 13
L 7
U 12
D 2
R 18
D 12
U 11
R 13
U 12
L 13
R 7
U 6
D 5
L 13
D 15
R 12
D 8
L 19
U 10
L 4
D 18
U 9
D 5
U 2
L 1
D 2
R 8
U 9
R 1
D 11
U 18
R 11
D 19
U 6
D 14
U 6
D 4
U 2
L 12
D 15
L 10
R 5
U 16
L 3
D 8
L 10
D 7
R 16
D 8
R 6
L 16
R 6
D 8
U 15
D 1
L 14
U 14
R 16
L 14
D 2
R 6
D 5
R 14
L 15
D 2
R 15
L 4
U 18
R 8
D 6
R 7
L 2
U 5
L 19
R 17
L 19
R 13
L 2
U 7
D 19
R 9
L 8
D 18
U 2
R 3
U 7
D 9
R 12
U 13
L 15
U 2
D 6
R 18
D 7
L 10
R 4
L 12
D 6
L 4
D 10
L 7
U 12
L 9
R 12
L 13
R 13
L 18
R 18
U 7
D 5
R 8
D 18
L 11
D 5
L 1
U 6
R 19
U 17
R 16
L 8
R 11
U 17
D 1
R 11
L 12
D 4
U 13
`;
}
