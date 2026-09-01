import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { userApi } from "../../../api/user.api";
import { useAuthStore } from "../../../store/auth.store";
import PageLoader from "../../../components/common/PageLoader";

interface ProfileFormInput {
  fullName: string;
  phone: string;
  bio: string;
  country: string;
  timezone: string;
}

interface PasswordFormInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ProfilePage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"info" | "security">("info");
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const { data: profile, isLoading, refetch } = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => userApi.getMe().then((r) => r.data.data),
  });

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    reset: resetProfile,
    formState: { errors: profileErrors, isSubmitting: profileSubmitting },
  } = useForm<ProfileFormInput>();

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    watch: watchPassword,
    formState: { errors: passwordErrors, isSubmitting: passwordSubmitting },
  } = useForm<PasswordFormInput>();

  // Reset form when profile data loads
  useEffect(() => {
    if (profile) {
      resetProfile({
        fullName: profile.fullName || "",
        phone: profile.phone || "",
        bio: profile.profile?.bio || "",
        country: profile.profile?.country || "",
        timezone: profile.profile?.timezone || "",
      });
    }
  }, [profile, resetProfile]);

  if (isLoading) {
    return <PageLoader />;
  }

  const onUpdateProfile = async (data: ProfileFormInput) => {
    setProfileSuccess("");
    setProfileError("");
    try {
      await userApi.updateProfile(data);
      setProfileSuccess("Profile updated successfully!");
      qc.invalidateQueries({ queryKey: ["my-profile"] });
      refetch();
    } catch (err: any) {
      setProfileError(err?.response?.data?.message || "Failed to update profile.");
    }
  };

  const onChangePassword = async (data: PasswordFormInput) => {
    setPasswordSuccess("");
    setPasswordError("");
    try {
      await userApi.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      setPasswordSuccess("Password changed successfully!");
      resetPassword();
    } catch (err: any) {
      setPasswordError(err?.response?.data?.message || "Failed to change password.");
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);

    setAvatarLoading(true);
    setProfileError("");
    try {
      const res = await userApi.updateAvatar(formData);
      if (res.data?.data?.avatar) {
        useAuthStore.getState().setAvatar(res.data.data.avatar);
      }
      setProfileSuccess("Avatar updated successfully!");
      qc.invalidateQueries({ queryKey: ["my-profile"] });
      refetch();
    } catch (err: any) {
      setProfileError(err?.response?.data?.message || "Failed to upload avatar.");
    } finally {
      setAvatarLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Left Side: Avatar and Card */}
        <div className="w-full md:w-1/3 bg-[#121822] rounded-3xl border border-white/10 p-6 flex flex-col items-center text-center h-fit shadow-sm">
          <div className="relative group mb-4">
            <div className="w-28 h-28 rounded-full bg-[#0e1520] border-2 border-white/10 flex items-center justify-center text-3xl font-black text-[#00c076] overflow-hidden shrink-0">
              {avatarLoading ? (
                <div className="w-8 h-8 rounded-full border-4 border-[#00c076]/20 border-t-[#00c076] animate-spin" />
              ) : profile?.profile?.avatar ? (
                <img src={profile.profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                profile?.username?.charAt(0).toUpperCase()
              )}
            </div>
            <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#00c076] hover:bg-[#00e676] text-[#080c10] flex items-center justify-center cursor-pointer shadow-md transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={avatarLoading} />
            </label>
          </div>

          <h2 className="text-lg font-bold text-white">{profile?.fullName || profile?.username}</h2>
          <p className="text-[10px] text-[#00e676] font-bold bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 rounded-full mt-1.5 uppercase tracking-wider">Admin / {profile?.profile?.type || "Executor"}</p>
          <p className="text-xs text-slate-400 mt-2 truncate w-full font-mono">{profile?.email}</p>

          <div className="w-full border-t border-white/10 my-4 pt-4 text-left space-y-2.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Username</span>
              <span className="font-bold text-white">{profile?.username}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Role</span>
              <span className="font-bold text-[#00e676]">Administrator</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Joined</span>
              <span className="font-mono text-slate-300">
                {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Tab Forms */}
        <div className="flex-1 bg-[#121822] rounded-3xl border border-white/10 p-6 shadow-sm">
          <div className="flex border-b border-white/10 mb-6">
            <button
              onClick={() => setActiveTab("info")}
              className={`pb-3 text-xs font-bold border-b-2 px-2 uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "info"
                  ? "border-[#00c076] text-[#00e676]"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              Account Information
            </button>
            <button
              onClick={() => setActiveTab("security")}
              className={`pb-3 text-xs font-bold border-b-2 px-2 ml-6 uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "security"
                  ? "border-[#00c076] text-[#00e676]"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              Security Settings
            </button>
          </div>

          {activeTab === "info" ? (
            <form onSubmit={handleSubmitProfile(onUpdateProfile)} className="space-y-5">
              {profileSuccess && (
                <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 text-[#00e676] rounded-2xl text-xs font-bold">
                  ✓ {profileSuccess}
                </div>
              )}
              {profileError && (
                <div className="p-3.5 bg-rose-500/15 border border-rose-500/30 text-rose-400 rounded-2xl text-xs font-bold">
                  ✕ {profileError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Full Name</label>
                  <input
                    {...registerProfile("fullName", { required: "Full name is required" })}
                    type="text"
                    className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-[#0e1520] text-white text-xs focus:outline-none focus:border-[#00c076]"
                    placeholder="John Doe"
                  />
                  {profileErrors.fullName && <p className="text-xs text-rose-400 mt-1">{profileErrors.fullName.message}</p>}
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Phone Number</label>
                  <input
                    {...registerProfile("phone", { minLength: { value: 7, message: "At least 7 digits" } })}
                    type="tel"
                    className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-[#0e1520] text-white text-xs focus:outline-none focus:border-[#00c076]"
                    placeholder="+1 234 567 890"
                  />
                  {profileErrors.phone && <p className="text-xs text-rose-400 mt-1">{profileErrors.phone.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Country</label>
                  <input
                    {...registerProfile("country")}
                    type="text"
                    className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-[#0e1520] text-white text-xs focus:outline-none focus:border-[#00c076]"
                    placeholder="United States"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Timezone</label>
                  <input
                    {...registerProfile("timezone")}
                    type="text"
                    className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-[#0e1520] text-white text-xs focus:outline-none focus:border-[#00c076]"
                    placeholder="UTC-5 or EST"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Bio</label>
                <textarea
                  {...registerProfile("bio", { maxLength: { value: 300, message: "Maximum 300 characters" } })}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-[#0e1520] text-white text-xs focus:outline-none focus:border-[#00c076] resize-none"
                  placeholder="Tell us about yourself..."
                />
                {profileErrors.bio && <p className="text-xs text-rose-400 mt-1">{profileErrors.bio.message}</p>}
              </div>

              <button
                type="submit"
                disabled={profileSubmitting}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#00c076] hover:bg-[#00e676] text-[#080c10] text-xs font-black transition-all shadow-md shadow-[#00c076]/20 disabled:opacity-60 cursor-pointer"
              >
                {profileSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmitPassword(onChangePassword)} className="space-y-5">
              {passwordSuccess && (
                <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 text-[#00e676] rounded-2xl text-xs font-bold">
                  ✓ {passwordSuccess}
                </div>
              )}
              {passwordError && (
                <div className="p-3.5 bg-rose-500/15 border border-rose-500/30 text-rose-400 rounded-2xl text-xs font-bold">
                  ✕ {passwordError}
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Current Password</label>
                <input
                  {...registerPassword("currentPassword", { required: "Current password is required" })}
                  type="password"
                  className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-[#0e1520] text-white text-xs focus:outline-none focus:border-[#00c076]"
                  placeholder="Enter current password"
                />
                {passwordErrors.currentPassword && <p className="text-xs text-rose-400 mt-1">{passwordErrors.currentPassword.message}</p>}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">New Password</label>
                <input
                  {...registerPassword("newPassword", {
                    required: "New password is required",
                    minLength: { value: 8, message: "Must be at least 8 characters" },
                  })}
                  type="password"
                  className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-[#0e1520] text-white text-xs focus:outline-none focus:border-[#00c076]"
                  placeholder="Create new password"
                />
                {passwordErrors.newPassword && <p className="text-xs text-rose-400 mt-1">{passwordErrors.newPassword.message}</p>}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Confirm New Password</label>
                <input
                  {...registerPassword("confirmPassword", {
                    required: "Please confirm your new password",
                    validate: (val) => val === watchPassword("newPassword") || "Passwords do not match",
                  })}
                  type="password"
                  className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-[#0e1520] text-white text-xs focus:outline-none focus:border-[#00c076]"
                  placeholder="Re-enter new password"
                />
                {passwordErrors.confirmPassword && <p className="text-xs text-rose-400 mt-1">{passwordErrors.confirmPassword.message}</p>}
              </div>

              <button
                type="submit"
                disabled={passwordSubmitting}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#00c076] hover:bg-[#00e676] text-[#080c10] text-xs font-black transition-all shadow-md shadow-[#00c076]/20 disabled:opacity-60 cursor-pointer"
              >
                {passwordSubmitting ? "Changing..." : "Change Password"}
              </button>
            </form>
          )}
        </div>
        
      </div>
    </div>
  );
}
