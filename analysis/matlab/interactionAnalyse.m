table;
plot(X,Y1);
hold on;
plot(X, Y2, 'red');
hold on;
plot(X, Y3, 'green');
legend('Without recommendation', 'Worst with recommendation', 'Best with recommendation');
xlabel('Group id');
ylabel('Number of interaction received by the server');