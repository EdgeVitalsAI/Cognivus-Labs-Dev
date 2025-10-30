clc
close all
clear all
tic

load '010217B.txt';% input name of text file with appropriate extension
A = X010217B ;% for data such as 111213A add X at the beginning => i.e X111213A
m=mean(A)
std = std(A)
[S,V]=dfa(A);
subplot (2,1,1)
title (['time-series'])
hold on
plot (A)
subplot (2,1,2)
scatter (S,V)
[r,a,b]=regression (S,V,'one'); % a = slope, b = intercept, r: correlation coefficnet (Pearson)
[r1,a1,b1]=regression (S(1:24),V(1:24),'one'); % a1 = slope, b1 = intercept, r1: correlation coefficnet (Pearson)
[r2,a2,b2]=regression (S(25:end),V(25:end),'one'); % a2 = slope, b2 = intercept, r2: correlation coefficnet (Pearson)

alpha = a(1,1)
title (['slope =',num2str(alpha),])
r
[se]=sampen(A,2,0.2)

[mse,sc]=msentropy(A);
toc


