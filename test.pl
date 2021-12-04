% edge(a,b).
% edge(a,a).
% edge(a,c).
% edge(c,b).
% edge(a,d).
% edge(a,f).
% edge(f,d).
% edge(d,f).

% mystery(L):-
%     findall(edge(X,Y),(member(X,L),member(Y,L)),Edges),
%     check(Edges).

% check([]).
% check([edge(X,X)|Rest]):- 
%     !, check(Rest).
% check([edge(X,Y)|Rest]):- 
%     (edge(X,Y);edge(Y,X)),
%     check(Rest).

% check([edge(a,b),edge(a,c),edge(a,a),edge(a,d),edge(b,c)]).

% descending_sublist(+,-,-) returns the left-most descending sublist, 
% and the rest of the list excluding that sublist. For example,
% descending_sublist([3,2,4,6,7], Sublist, Rest)
% Sublist = [3,2]
% Rest = [4,6,7]

% If the next item <= the first item, append the first item to the output list
% and continue on the list
descending_sublist([X0,X1|Xs], [X0|Rest], R) :-
    X0 >= X1, !, descending_sublist([X1|Xs], Rest, R).
% If the next item is greater than the first item, return the first item, and 
% return the rest of the list 
descending_sublist([X0,X1|Xs], [X0], [X1|Xs]) :- X0 < X1, !.
descending_sublist([X], [X], []). % End of the list was reached, return the last element

% Get the first sublist in the list, then the first sublist in the rest of that
% list, and so on
descend(L, [Y|Rest]) :- descending_sublist(L, Y, R), !, descend(R, Rest).
descend([], []).

% Simple case, return the resistance of a resistor
resist(res(R), R).
% R = R_A + R_B
resist(seq(A, B), R) :- resist(A, RA), resist(B, RB), R is RA + RB.
% 1/R = 1/R_A + 1/R_B
resist(par(A, B), R) :- resist(A, RA), resist(B, RB), R is 1 / ((1 / RA) + (1 / RB)).

map(fun(X,Q,Y), [], []).
% map(fun(A,Q,B), [X|Xs], [Y|Rest]) :-
%     % A = X,
%     % B = Y,
%     Q, !, map(fun(A,Q,B), Xs, Rest).

% % map(fun(X,(Y is X+1), Y), [1,2,3], L).
% IN=3, findall(Y, (Y is IN+10), [Y]).
% IN = 3,
% Y = 13.

% Finds all Ys such that Y conforms to the predicate that depends on X, 
% and X is a member of the input elements
map(fun(X,Q,Y), INPUTS, OUTPUTS) :- findall(Y, (member(X, INPUTS), Q), OUTPUTS).


filter([],_,[]).
filter([X|Xs],G,[X|Ys]):- Z=..[G,X], Z, filter(Xs,G,Ys).
filter([_|Xs],G,Ys):- filter(Xs,G,Ys).

g(X):- X<10.
