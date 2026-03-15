import Iter "mo:core/Iter";
import Int "mo:core/Int";
import Map "mo:core/Map";
import Order "mo:core/Order";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";

actor {
  type ScoreEntry = {
    playerName : Text;
    score : Nat;
    fishCount : Nat;
    timestamp : Int;
  };

  module ScoreEntry {
    public func compare(entry1 : ScoreEntry, entry2 : ScoreEntry) : Order.Order {
      Nat.compare(entry2.score, entry1.score);
    };
  };

  let scores = Map.empty<Nat, ScoreEntry>();
  var nextId = 0;

  public shared ({ caller }) func addScore(playerName : Text, score : Nat, fishCount : Nat, timestamp : Int) : async () {
    let entry : ScoreEntry = {
      playerName;
      score;
      fishCount;
      timestamp;
    };
    scores.add(nextId, entry);
    nextId += 1;
  };

  public query ({ caller }) func getTopScores() : async [ScoreEntry] {
    let entries = scores.values().toArray();
    let sortedEntries = entries.sort();
    let topEntries = Array.tabulate(
      Nat.min(10, sortedEntries.size()),
      func(i) { sortedEntries[i] },
    );
    topEntries;
  };

  public shared ({ caller }) func clearScores() : async () {
    scores.clear();
    nextId := 0;
  };
};
