//! Make and Parse [W3C Traceparents](https://www.w3.org/TR/trace-context/#traceparent-header)

#![deny(unsafe_code)]
#![deny(clippy::all, clippy::pedantic, clippy::nursery)]
#![allow(
    clippy::must_use_candidate,
    clippy::needless_pass_by_value,
    clippy::missing_panics_doc,
    clippy::module_name_repetitions,
    clippy::unused_async,
    soft_unstable
)]

use anyhow::bail;

static W3C_TRACEPARENT_VERSION: u8 = 0;
static BIT_FLAG_SAMPLED: u8 = 1 << 0;

#[derive(Eq, PartialEq)]
pub struct Traceparent {
    version: u8,
    trace_id: u128, // 16 bytes
    parent_id: u64, // 8 bytes
    flags: u8,
}

impl Traceparent {
    pub fn child(&self, sampled: bool) -> Traceparent {
        Traceparent {
            version: self.version,
            trace_id: self.trace_id,
            parent_id: fastrand::u64(..),
            flags: ((sampled as u8) & self.flags) & BIT_FLAG_SAMPLED,
        }
    }

    pub fn sampled(&self) -> bool {
        (BIT_FLAG_SAMPLED & self.flags) != 0
    }
}

impl std::clone::Clone for Traceparent {
    fn clone(&self) -> Self {
        self.child(self.sampled())
    }
}

impl std::default::Default for Traceparent {
    fn default() -> Self {
        make(true)
    }
}

impl Into<Traceparent> for &'static str {
    fn into(self) -> Traceparent {
        parse(self).unwrap()
    }
}

impl core::fmt::Display for Traceparent {
    fn fmt(&self, f: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
        write!(
            f,
            "{:02x}-{:032x}-{:016x}-{:02x}",
            self.version, self.trace_id, self.parent_id, self.flags
        )
    }
}

pub fn make(sampled: bool) -> Traceparent {
    Traceparent {
        version: W3C_TRACEPARENT_VERSION,
        trace_id: fastrand::u128(..),
        parent_id: fastrand::u64(..),
        flags: (sampled as u8) & BIT_FLAG_SAMPLED,
    }
}

pub fn parse(value: &'static str) -> anyhow::Result<Traceparent> {
    if value.len() != 55 {
        bail!("traceparent is not of length 55")
    }

    let segs: Vec<&str> = value.split('-').collect();

    Ok(Traceparent {
        version: u8::from_str_radix(segs[0], 16)?,
        trace_id: u128::from_str_radix(segs[1], 16)?,
        parent_id: u64::from_str_radix(segs[2], 16)?,
        flags: u8::from_str_radix(segs[3], 16)?,
    })
}

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn sampled() {
        assert_eq!(make(true).sampled(), true);
        assert_eq!(make(false).sampled(), false);
        // one day when other flags exist, this might break a little
        assert_eq!(make(true).flags, 1);
        assert_eq!(make(false).flags, 0);
    }

    #[test]
    fn can_parse() {
        let root = parse("00-e89359198545da29d14778a03be06e18-2be02a72f64ecf40-00").unwrap();
        assert_eq!(root.version, 0);
        assert_eq!(root.trace_id, 309145969816709842465435622754465377816);
        assert_eq!(root.parent_id, 3161573611661086528);
        assert_eq!(root.flags, 0);
        assert_eq!(root.sampled(), false);
    }

    #[test]
    fn child_create() {
        let parent = Traceparent::default();
        let child = parent.clone();

        assert_eq!(parent.trace_id, child.trace_id);
        assert_ne!(parent.parent_id, child.parent_id);
        assert_ne!(parent.to_string(), child.to_string());
    }

    #[test]
    fn child_sampled_passing() {
        let parent = make(true);
        let child = parent.clone();

        assert_eq!(parent.sampled(), true);
        assert_eq!(child.sampled(), true);

        let parent = make(false);
        let child = parent.clone();

        assert_eq!(parent.sampled(), false);
        assert_eq!(child.sampled(), false);
    }

    #[test]
    fn child_sample_wont_affect_parent() {
        let parent = make(true);
        let child = parent.child(false);

        assert_eq!(parent.sampled(), true);
        assert_eq!(child.sampled(), false);
    }
}
