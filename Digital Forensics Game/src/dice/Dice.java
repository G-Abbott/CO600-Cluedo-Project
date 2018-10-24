package dice;

public class Dice {
	private static int numberofSides;
	private static int diceRoll;
	
	public static void rollDice() {
		numberofSides = 12;
		diceRoll = (int) (Math.random() * numberofSides) + 2;
		System.out.println(diceRoll);
	}
	public static void main(String[] args) {
		rollDice();
	}

}
