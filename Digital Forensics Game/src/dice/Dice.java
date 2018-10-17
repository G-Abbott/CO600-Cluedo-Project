package dice;

public class Dice {
	public static void main(String[] args) {
		int numberofSides = 6;
		int diceRoll = (int) (Math.random() * numberofSides) + 1;
		System.out.println(diceRoll);
	}

}
